import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";

export const worker = setupWorker(...handlers);

/** Start MSW only when mocks are enabled (default in dev / offline demo). */
export async function startMockWorker() {
  await worker.start({
    onUnhandledRequest: "bypass",
    quiet: true,
  });
}
