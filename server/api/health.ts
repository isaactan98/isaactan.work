/**
 * Liveness endpoint for the container healthcheck and for the tunnel to probe.
 *
 * Deliberately trivial: it proves the Node process is up and serving routes,
 * which is exactly what the orchestrator needs to decide whether to restart.
 * It does not touch the content database — a health check that can fail for
 * reasons unrelated to liveness causes restart loops rather than preventing
 * them.
 */
export default defineEventHandler(() => ({
  status: 'ok',
  uptime: Math.round(process.uptime())
}))
