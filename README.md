# MBT monorepo

Monorepo pnpm + Turborepo pour les projets MBT (taxis PMR / VSL / HandyCab, etc.).

## Structure

```text
apps/mbttaxis   → site Next.js (reproduction www.mbttaxis.be)
packages/       → packages partagés (futurs)
infos/          → source de vérité design + textes (ne pas ignorer)
.cursor/skills/mbttaxis → skill agent Cursor ancrée sur infos/
```

## Prérequis

- Node.js ≥ 20
- pnpm 10 (`corepack enable` ou install global)

## Commandes

```bash
pnpm install
pnpm dev:mbttaxis   # http://localhost:3000
pnpm build          # build toutes les apps
```

## Ajouter une future app

1. Créer `apps/<nom>` (ex. `pnpm create next-app apps/handycab …`)
2. Elle est automatiquement prise en charge par `pnpm-workspace.yaml` (`apps/*`)
3. Lancer avec `pnpm --filter <nom> dev`

## Site mbttaxis

- Contenu en dur : `apps/mbttaxis/content/`
- Formulaires mock (pas d’e-mail) : Server Actions dans `src/app/actions/forms.ts`
- Design / copy : lire d’abord `infos/mbttaxis-spec-reproduction.md` et `infos/mbttaxis-textes-complets.md`
- Médias : placeholders pour l’instant — remplacer par les originaux listés §7 de la spec (logo, photos, YouTube `KhuPKHfK2ZA`)
