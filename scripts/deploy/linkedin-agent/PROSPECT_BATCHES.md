# Prospect cards in Telegram

This service sends existing prospect cards to the owner's already configured private Telegram chat. It never visits LinkedIn or sends invitations. It is independent of the publication and public-research services.

Place the worker, control, test, service, timer and installer files together, then run `install-prospect-batches.sh` as root. The installer verifies the recipient against the confirmed first delivery and the existing Hermes destination, and imports the first five contacts into the persistent deduplication ledger. It preserves an existing pause and ledger when updating.

The timer starts thirty minutes after activation and then every thirty minutes. Each delivery contains at most five distinct profile URLs, with a daily cap of fifty contacts in Europe/Paris, including previously reserved or uncertain deliveries. The last batch may be smaller. Empty queues and sources older than seven days produce no Telegram message. A new source can be consumed without replaying contacts already delivered.

State: `/var/lib/bm-prospect-batches/` (root only). Telegram settings/status: `/home/hermes/bm-agents/livrables/prospects-us-manual/auto-delivery-*.json` (accessible to Hermes). The sender uses the existing `hermes send` CLI; no bot token is copied into the service configuration.

Owner commands from Telegram: `bm-linkedin-batches status`, `pause`, `resume`. A resumed setting does not retry an uncertain delivery. Inspect the recorded receipt before resolving it; never delete the deduplication history to retry. Use `systemctl list-timers bm-prospect-batches.timer` for the actual next trigger; `eligibleAfter` in the status is only the earliest permitted time.

Tests: `python3 test-prospect-batch-delivery.py -v` on Linux. They use temporary sources, databases and mocked senders, with no external network calls.
