// One-off: grant public (unauthenticated) invoker access to the stripeWebhook
// Cloud Function. Stripe calls this endpoint with no Google auth, so it must
// allow allUsers — Cloud Functions gen2 doesn't always get this binding set
// automatically depending on org/project IAM defaults.
import { GoogleAuth } from "google-auth-library";
import fs from "node:fs";

const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
if (!raw) throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY is not set.");
const credentials = JSON.parse(raw);
const projectId = credentials.project_id;
const region = "us-central1";
const fnName = "stripeWebhook";

const auth = new GoogleAuth({
  credentials,
  scopes: ["https://www.googleapis.com/auth/cloud-platform"],
});
const client = await auth.getClient();

const resource = `projects/${projectId}/locations/${region}/functions/${fnName}`;
const url = `https://cloudfunctions.googleapis.com/v2/${resource}:setIamPolicy`;

const res = await client.request({
  url,
  method: "POST",
  data: {
    policy: {
      bindings: [
        {
          role: "roles/cloudfunctions.invoker",
          members: ["allUsers"],
        },
      ],
    },
  },
});
console.log("setIamPolicy (cloudfunctions.invoker) result:", JSON.stringify(res.data, null, 2));

// Gen2 functions run on Cloud Run under the hood — the actual HTTP entrypoint
// is gated by Cloud Run's own invoker policy, not just the Functions one.
const runUrl = `https://run.googleapis.com/v2/projects/${projectId}/locations/${region}/services/${fnName.toLowerCase()}:setIamPolicy`;
const runRes = await client.request({
  url: runUrl,
  method: "POST",
  data: {
    policy: {
      bindings: [
        {
          role: "roles/run.invoker",
          members: ["allUsers"],
        },
      ],
    },
  },
});
console.log("setIamPolicy (run.invoker) result:", JSON.stringify(runRes.data, null, 2));
