#!/bin/bash
set -euo pipefail

cd /home/kavia/workspace/code-generation/Business-Loan/ApplicantPortal\(React\)

# Ensure devDependencies (vite) are available in CI/lint environment.
npm ci

npm run build
