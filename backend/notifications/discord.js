/* ============================================================
   DisNotify — notifications/discord.js
   The best channel for this audience — gamers live in Discord and
   webhooks need no OAuth, no app review and no cost.

   ── WHAT YOU NEED TO CODE ──────────────────────────────────
   1. export async function send(userId, message)
        POST users.settings.discordWebhook with a rich embed:
          { embeds: [{
              title: 'RTX 4070 SUPER — R 13 999',
              url: message.url,
              description: 'Evetech · was R 16 999 · **-18%**',
              color: 0x2ee6a8,
              thumbnail: { url: productImage },
              fields: [ { name: 'All-time low', value: 'R 13 999', inline: true },
                        { name: 'Retailer', value: 'Evetech', inline: true } ],
              timestamp: new Date().toISOString(),
              footer: { text: 'DisNotify' } }] }
   2. VALIDATE THE URL before ever calling it. Only allow
      ^https://discord(app)?\.com/api/webhooks/  — an unvalidated
      user-supplied URL turns your server into an open request proxy
      (SSRF). routes/settings.js validates on save; validate again
      here, because settings rows can be old.
   3. Rate limits: 5 requests per 2 seconds per webhook. Honour the
      `retry_after` field on a 429 response.
   4. A 404 means the webhook was deleted. Clear it from the user's
      settings and disable their discord channel, then tell them in
      the app. Do not keep retrying forever.
   5. Never log the webhook URL — it is a credential; anyone holding
      it can post to that channel.

   LATER: a proper Discord bot could DM users and let them add alerts
   with a slash command. Much nicer, but it needs OAuth and hosting.
   ============================================================ */
throw new Error('notifications/discord.js is a scaffold.');
