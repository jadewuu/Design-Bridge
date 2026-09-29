# Design Bridge attribution

Design Bridge is an internal adaptation of TemPad Dev.
It is not an original implementation of the upstream Figma extraction engine.

Upstream: https://github.com/ecomfe/tempad-dev

Baseline: 9f345f3baf47e6659f8f5ac020883a3f18fc23f2 (2026-09-27).

The upstream MIT license and copyright notice are included in LICENSE.
Dependencies retain their own licenses in mcp/node_modules.

This adaptation adds local distribution and client installation, company branding,
isolated runtime locations and ports, and bundled Figma compatibility rules.
Internal package scopes and wire schema identifiers are preserved where they are
implementation details. Core design reading requires neither a published
@tempad-dev package, an upstream rule update endpoint, or an upstream plugin
catalog. The optional code transform plugin installer accepts explicit URLs
supplied by the user and downloads plugins only from those URLs.
