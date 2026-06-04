# SkillFlux Plugin for OpenCode

Install this repository as an OpenCode plugin, then route model requests through
the SkillFlux gateway or use the HTTP proxy adapter. The local plugin sends
`legal-writer` harness signals only; the gateway owns workflow selection and
hidden prompt injection.

```json
{
  "plugin": ["skillflux-plugin@git+https://github.com/vc999999999/skillflux-plugin.git"]
}
```

Use `skillflux-harness debug --input <request.json>` to inspect local signals.
