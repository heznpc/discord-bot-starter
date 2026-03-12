# Discord Bot Starter

Discord.js v14 bot with Docker, CI/CD, and Railway/Fly.io deployment.

## Project Structure

```
src/
  index.js          → Entry point + graceful shutdown (SIGINT/SIGTERM)
  config.js         → Environment variable validation
  commands/         → Slash commands (auto-loaded by commands/index.js)
    index.js        → Command loader (reads all .js files in this directory)
    ping.js         → Example command
    help.js         → Example command
  events/           → Event handlers (auto-loaded by events/index.js)
    index.js        → Event loader
    ready.js        → Bot ready handler
    interactionCreate.js → Command router
scripts/
  deploy-commands.js → Registers slash commands with Discord API
  bump-version.js    → Version bumping
Dockerfile          → Node 20 Alpine, production build
docker-compose.yml  → Local dev with hot reload
.env.example        → DISCORD_TOKEN, DISCORD_CLIENT_ID
```

## CI/CD Pipeline

- **ci.yml**: Push/PR to main. npm audit + ESLint + Jest + Docker build. No secrets.
- **cd-railway.yml**: Manual trigger. CI gate → version extract → Railway deploy → GitHub Release.
- **cd-fly.yml**: Manual trigger. CI gate → version extract → Fly.io deploy → GitHub Release.
- **setup.yml**: First push only. Creates setup checklist Issue.

## Secrets

| Secret | For | Required |
|--------|-----|----------|
| `RAILWAY_TOKEN` | Railway deploy | If using Railway |
| `RAILWAY_SERVICE_ID` | Railway deploy | If using Railway |
| `FLY_API_TOKEN` | Fly.io deploy | If using Fly.io |

Choose ONE deployment target (Railway OR Fly.io), not both.

## What to Modify

- `src/commands/` → Add new commands (one file per command, auto-loaded)
- `src/events/` → Add new event handlers (auto-loaded)
- `.env.example` → Add your environment variables
- `package.json` → Update name, description
- Version → `npm run version:patch|minor|major`

## Do NOT Modify

- `src/commands/index.js` → Auto-loader logic
  - **Why**: 모든 .js 파일을 동적으로 읽어 슬래시 커맨드를 등록. 이 파일 수정 시 커맨드가 로드되지 않음.
- `src/events/index.js` → Auto-loader logic
  - **Why**: 같은 패턴. 이벤트 핸들러 자동 등록.
- Graceful shutdown in `src/index.js`
  - **Why**: SIGINT/SIGTERM 수신 시 Discord 연결을 정상 해제. 없으면 컨테이너 재시작 시 "봇이 오프라인인데 메시지에 응답" 유령 상태 발생.
- Version guard logic in cd workflows
  - **Why**: 같은 버전 태그로 재배포하면 GitHub Release 충돌. bump 먼저 해야 배포 가능.

## Adding a New Command

Create `src/commands/mycommand.js`:
```js
import { SlashCommandBuilder } from 'discord.js';
export const data = new SlashCommandBuilder()
  .setName('mycommand')
  .setDescription('Description');
export async function execute(interaction) {
  await interaction.reply('Response');
}
```
Then run `npm run deploy-commands` to register with Discord.

## Key Patterns

- `node --watch` for dev (no nodemon dependency)
- Commands/events are auto-discovered from their directories
- `config.js` validates required env vars at startup (fails fast)
- Bot uses `discord.js` v14 with slash commands only (no message prefix)
