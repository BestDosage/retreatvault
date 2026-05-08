import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import dotenv from "dotenv";

dotenv.config({ path: resolve(__dirname, "../.env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

interface RawReview {
  author_name?: string;
  rating?: number;
  text?: string;
  review_text?: string;
  date?: string;
  review_date?: string;
  owner_response?: string;
  review_id?: string;
}

interface RawEntity {
  retreat_id?: string;
  practitioner_id?: string;
  operator_id?: string;
  slug?: string;
  place_name?: string;
  name?: string;
  reviews: RawReview[];
}

interface ProjectConfig {
  project: string;
  filePath: string;
}

const PROJECT_CONFIGS: ProjectConfig[] = [
  {
    project: "retreatvault",
    filePath: resolve(__dirname, "../../retreatvault/data/remaining-reviews.json"),
  },
  {
    project: "bestdosage",
    filePath: resolve(__dirname, "../../bestdosage/data/practitioner-reviews.json"),
  },
  {
    project: "oktodive",
    filePath: resolve("/Users/waldman/bestdepth/data/operator-reviews.json"),
  },
];

function getEntityId(entity: RawEntity): string {
  return entity.retreat_id || entity.practitioner_id || entity.operator_id || entity.slug || "";
}

function getEntityName(entity: RawEntity): string | undefined {
  return entity.place_name || entity.name;
}

async function uploadProject(config: ProjectConfig) {
  if (!existsSync(config.filePath)) {
    console.warn(`Skipping ${config.project}: file not found at ${config.filePath}`);
    return { project: config.project, uploaded: 0, skipped: true };
  }

  const raw = JSON.parse(readFileSync(config.filePath, "utf-8")) as RawEntity[];
  const rows: any[] = [];

  for (const entity of raw) {
    const entityId = getEntityId(entity);
    const entityName = getEntityName(entity);

    if (!entityId || !entity.reviews?.length) continue;

    for (const review of entity.reviews) {
      const reviewText = review.text || review.review_text;
      if (!reviewText) continue;

      // Generate a stable review_id if missing
      const reviewId =
        review.review_id ||
        `${(review.author_name || "anon").replace(/\s+/g, "_")}_${review.rating || 0}_${(reviewText || "").slice(0, 30).replace(/\s+/g, "_")}`;

      rows.push({
        project: config.project,
        entity_id: entityId,
        entity_name: entityName,
        source: "google",
        author_name: review.author_name,
        rating: review.rating,
        review_text: reviewText,
        review_date: review.date || review.review_date,
        owner_response: review.owner_response,
        review_id: reviewId,
      });
    }
  }

  if (rows.length === 0) {
    console.log(`${config.project}: no reviews to upload`);
    return { project: config.project, uploaded: 0, skipped: false };
  }

  // Upsert in batches of 500
  const BATCH_SIZE = 500;
  let totalUpserted = 0;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const { error, count } = await supabase
      .from("scraped_reviews")
      .upsert(batch, {
        onConflict: "project,entity_id,review_id",
        ignoreDuplicates: false,
      });

    if (error) {
      console.error(`Error uploading ${config.project} batch ${i / BATCH_SIZE + 1}:`, error.message);
    } else {
      totalUpserted += batch.length;
    }
  }

  console.log(`${config.project}: upserted ${totalUpserted} reviews`);
  return { project: config.project, uploaded: totalUpserted, skipped: false };
}

async function main() {
  const args = process.argv.slice(2);
  const projectFlagIdx = args.indexOf("--project");
  const targetProject = projectFlagIdx !== -1 ? args[projectFlagIdx + 1] : null;

  const configs = targetProject
    ? PROJECT_CONFIGS.filter((c) => c.project === targetProject)
    : PROJECT_CONFIGS;

  if (targetProject && configs.length === 0) {
    console.error(`Unknown project: ${targetProject}. Valid: retreatvault, bestdosage, oktodive`);
    process.exit(1);
  }

  console.log(`Uploading reviews for: ${configs.map((c) => c.project).join(", ")}\n`);

  const results = [];
  for (const config of configs) {
    results.push(await uploadProject(config));
  }

  console.log("\n--- Summary ---");
  for (const r of results) {
    console.log(`${r.project}: ${r.skipped ? "SKIPPED (file not found)" : `${r.uploaded} reviews`}`);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
