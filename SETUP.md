# VoiceRoom - phone setup (one step at a time)

VoiceRoom shows who is in your Discord voice channel and who is talking, in a small see-through overlay.
Players talk in Discord (it keeps running behind Minecraft). VoiceRoom is only the display.

## Part 1: make the bot (on your phone browser)
1. Open https://discord.com/developers/applications and log in.
2. Tap New Application, name it VoiceRoom, tap Create.
3. Tap Bot in the menu. Turn ON "Server Members Intent". Tap Reset Token, then Copy. Keep this token secret.
4. Tap OAuth2, then URL Generator. Tick "bot". Under permissions tick View Channels and Connect. Open the link it makes and add the bot to your server.

## Part 2: get your IDs
5. In Discord: Settings, Advanced, turn on Developer Mode.
6. Long-press your server icon, tap Copy Server ID. This is GUILD_ID.
7. Long-press your voice channel, tap Copy Channel ID. This is VOICE_CHANNEL_ID.

## Part 3: host it (free, from your phone browser)
8. Put this folder in a free GitHub repository (github.com, sign up, New repository, Add file, Upload files).
9. Go to https://render.com, sign up with GitHub, tap New, Web Service, pick your repository.
10. Build command: npm install     Start command: node bot.js
11. Under Environment add: DISCORD_TOKEN, GUILD_ID, VOICE_CHANNEL_ID, DASH_PASSWORD (pick any password).
12. Tap Create. When it finishes, Render shows your link, like https://voiceroom-xxxx.onrender.com

## Part 4: use it
13. On your phone open: your-link/?key=YOURPASSWORD
14. Join the Discord voice channel and talk. The bot joins too (it stays muted and only watches).
15. Buttons at the top: list on/off, compact mode (shows only people talking), see-through level.

## Showing it over Minecraft
- Phone: use Discord's own overlay is not on iOS. Best option is split-screen or a floating/pop-up browser window (Android) with this page.
- Xbox/PC: open the link on a second device or Edge snapped beside the game. The Discord app on Xbox shows speaking rings too.
Browsers cannot draw over a full-screen game by themselves, so the page is small and see-through to sit in a corner window.

## Notes
- Render's free plan sleeps after 15 minutes without visitors; the first open takes about a minute.
- Never share your bot token. If it leaks, reset it on the developer page.
