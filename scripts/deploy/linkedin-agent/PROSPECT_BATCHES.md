# Prospect cards in Telegram

This service sends existing prospect cards to the owner's already configured private Telegram chat. It never visits LinkedIn or sends invitations. It is independent of the publication and public-research services.

Place the worker, control, test, service, timer and installer files together, then run `install-prospect-batches.sh` as root. The installer verifies the recipient against the confirmed first delivery and the existing Hermes destination, and imports the first five contacts into the persistent deduplication ledger. It preserves an existing pause and ledger when updating.

The timer uses a fixed calendar phase anchored at initial activation, with a slot every thirty minutes. Reloads and reinstalls preserve that phase; a reboot skips missed slots without a catch-up burst. Each delivery contains at most five distinct profile URLs, with a daily cap of fifty contacts in Europe/Paris, including previously reserved or uncertain deliveries. The last batch may be smaller. Empty queues and sources older than seven days produce no Telegram message.

Daily public research runs at 07:00 Europe/Paris, targeting fifty new qualified US contacts with persistent URL/person/company deduplication. Its `batches/YYYY-MM-DD.json` exports feed this service automatically, including partially completed research. Delivery merges the latest export with the recent daily archive and sends older undelivered contacts first, preserving the source dates in each message. Replacing `latest.json` therefore cannot erase the undelivered backlog. Counts remain partial when fewer than fifty contacts qualify; no fabricated contacts fill the quota. Research and delivery have independent pause controls.

State: `/var/lib/bm-prospect-batches/` (root only). Telegram settings/status: `/home/hermes/bm-agents/livrables/prospects-us-manual/auto-delivery-*.json` (accessible to Hermes). The sender uses the existing `hermes send` CLI; no bot token is copied into the service configuration.

Owner commands from Telegram: `bm-linkedin-batches status`, `pause`, `resume`. A resumed setting does not retry an uncertain delivery. Inspect the recorded receipt before resolving it; never delete the deduplication history to retry. Use `systemctl list-timers bm-prospect-batches.timer` for the actual next trigger; `eligibleAfter` in the status is only the earliest permitted time.

Tests: `python3 test-prospect-batch-delivery.py -v` on Linux, with the existing `prospect-worker.py` alongside it for the producer/consumer integration test. They use temporary sources, databases and mocked senders, with no external network calls.
