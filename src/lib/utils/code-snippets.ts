import type { HttpMethod, KeyValuePair, RequestBody, AuthConfig } from "../types";

export interface SnippetContext {
  url: string;
  method: HttpMethod;
  headers: KeyValuePair[];
  body: RequestBody;
  auth: AuthConfig;
}

export function generateSnippet(language: string, ctx: SnippetContext): string {
  switch (language) {
    case "curl":
      return generateCurl(ctx);
    case "javascript":
      return generateJavaScript(ctx);
    case "python":
      return generatePython(ctx);
    case "go":
      return generateGo(ctx);
    case "rust":
      return generateRust(ctx);
    case "java":
      return generateJava(ctx);
    default:
      return "// Unsupported language";
  }
}

function getActiveHeaders(ctx: SnippetContext): Record<string, string> {
  const h: Record<string, string> = {};
  for (const header of ctx.headers) {
    if (header.enabled) h[header.key] = header.value;
  }
  // Auth headers
  if (ctx.auth.type === "bearer" && ctx.auth.bearer?.token) {
    h["Authorization"] = `Bearer ${ctx.auth.bearer.token}`;
  }
  if (ctx.auth.type === "basic" && ctx.auth.basic) {
    h["Authorization"] = `Basic ${btoa(`${ctx.auth.basic.username}:${ctx.auth.basic.password}`)}`;
  }
  if (ctx.auth.type === "api-key" && ctx.auth.apiKey?.in === "header") {
    h[ctx.auth.apiKey.key] = ctx.auth.apiKey.value;
  }
  if (ctx.auth.type === "oauth2" && ctx.auth.oauth2?.accessToken) {
    h["Authorization"] = `Bearer ${ctx.auth.oauth2.accessToken}`;
  }
  return h;
}

function getBodyString(ctx: SnippetContext): string {
  switch (ctx.body.mode) {
    case "json":
      return ctx.body.json || "";
    case "graphql": {
      const gql = ctx.body.graphql;
      return JSON.stringify({ query: gql?.query, variables: gql?.variables || {} });
    }
    case "text":
      return ctx.body.text || "";
    case "urlencoded": {
      const params = new URLSearchParams();
      for (const item of ctx.body.urlencoded || []) {
        params.append(item.key, item.value);
      }
      return params.toString();
    }
    default:
      return "";
  }
}

function generateCurl(ctx: SnippetContext): string {
  const headers = getActiveHeaders(ctx);
  const body = getBodyString(ctx);
  const parts = [`curl -X ${ctx.method} '${ctx.url}'`];

  for (const [k, v] of Object.entries(headers)) {
    parts.push(`  -H '${k}: ${v}'`);
  }

  if (body) {
    if (ctx.body.mode === "json" || ctx.body.mode === "graphql") {
      parts.push(`  -H 'Content-Type: application/json'`);
      parts.push(`  -d '${body.replace(/'/g, "\\'")}'`);
    } else {
      parts.push(`  -d '${body}'`);
    }
  }

  return parts.join(" \\\n");
}

function generateJavaScript(ctx: SnippetContext): string {
  const headers = getActiveHeaders(ctx);
  const body = getBodyString(ctx);
  const isJson = ctx.body.mode === "json" || ctx.body.mode === "graphql";

  let code = `fetch('${ctx.url}', {\n`;
  code += `  method: '${ctx.method}',\n`;

  const headerEntries = Object.entries(headers);
  if (headerEntries.length > 0) {
    code += `  headers: {\n`;
    for (const [k, v] of headerEntries) {
      code += `    '${k}': '${v.replace(/'/g, "\\'")}',\n`;
    }
    if (isJson) code += `    'Content-Type': 'application/json',\n`;
    code += `  },\n`;
  }

  if (body) {
    code += isJson ? `  body: JSON.stringify(${body}),\n` : `  body: '${body}',\n`;
  }

  code += `})\n  .then(res => res.json())\n  .then(data => console.log(data))\n  .catch(err => console.error(err));`;
  return code;
}

function generatePython(ctx: SnippetContext): string {
  const headers = getActiveHeaders(ctx);
  const body = getBodyString(ctx);
  const isJson = ctx.body.mode === "json" || ctx.body.mode === "graphql";

  let code = `import requests\n\n`;
  code += `url = '${ctx.url}'\n`;
  code += `headers = ${JSON.stringify(headers, null, 2)}\n`;

  if (body) {
    if (isJson) {
      code += `data = ${body}\n`;
      code += `response = requests.${ctx.method.toLowerCase()}('${ctx.url}', headers=headers, json=data)\n`;
    } else {
      code += `data = '${body}'\n`;
      code += `response = requests.${ctx.method.toLowerCase()}('${ctx.url}', headers=headers, data=data)\n`;
    }
  } else {
    code += `response = requests.${ctx.method.toLowerCase()}('${ctx.url}', headers=headers)\n`;
  }

  code += `\nprint(response.status_code)\nprint(response.json())`;
  return code;
}

function generateGo(ctx: SnippetContext): string {
  const headers = getActiveHeaders(ctx);
  const body = getBodyString(ctx);
  const bodyVar = body ? `payload` : "nil";

  let code = `package main\n\nimport (\n`;
  code += `\t"fmt"\n`;
  code += `\t"io"\n`;
  code += `\t"net/http"\n`;
  if (body) code += `\t"strings"\n`;
  code += `)\n\n`;
  code += `func main() {\n`;
  code += `\turl := "${ctx.url}"\n`;

  if (body) {
    code += `\tpayload := strings.NewReader(\`${body}\`)\n`;
  }

  code += `\treq, _ := http.NewRequest("${ctx.method}", url, ${bodyVar})\n`;

  for (const [k, v] of Object.entries(headers)) {
    code += `\treq.Header.Set("${k}", "${v}")\n`;
  }

  code += `\tclient := &http.Client{}\n`;
  code += `\tresp, err := client.Do(req)\n`;
  code += `\tif err != nil {\n\t\tfmt.Println(err)\n\t\treturn\n\t}\n`;
  code += `\tdefer resp.Body.Close()\n`;
  code += `\tbody, _ := io.ReadAll(resp.Body)\n`;
  code += `\tfmt.Println(string(body))\n`;
  code += `}`;
  return code;
}

function generateRust(ctx: SnippetContext): string {
  const headers = getActiveHeaders(ctx);
  const body = getBodyString(ctx);

  let code = `use reqwest;\n\n`;
  code += `#[tokio::main]\nasync fn main() -> Result<(), Box<dyn std::error::Error>> {\n`;
  code += `\tlet client = reqwest::Client::new();\n`;
  
  let builder = `\tlet res = client\n\t\t.${ctx.method.toLowerCase()}("${ctx.url}")\n`;

  for (const [k, v] of Object.entries(headers)) {
    builder += `\t\t.header("${k}", "${v}")\n`;
  }

  if (body) {
    const isJson = ctx.body.mode === "json" || ctx.body.mode === "graphql";
    if (isJson) {
      builder += `\t\t.json(&${body})\n`;
    } else {
      builder += `\t\t.body("${body}")\n`;
    }
  }

  builder += `\t\t.send().await?;\n`;
  code += builder;
  code += `\tprintln!("Status: {}", res.status());\n`;
  code += `\tlet body = res.text().await?;\n`;
  code += `\tprintln!("{}", body);\n`;
  code += `\tOk(())\n`;
  code += `}`;
  return code;
}

function generateJava(ctx: SnippetContext): string {
  const headers = getActiveHeaders(ctx);
  const body = getBodyString(ctx);

  let code = `import java.net.http.*;\nimport java.net.URI;\n\n`;
  code += `public class ApiRequest {\n`;
  code += `\tpublic static void main(String[] args) throws Exception {\n`;
  code += `\t\tHttpClient client = HttpClient.newHttpClient();\n`;
  code += `\t\tHttpRequest request = HttpRequest.newBuilder()\n`;
  code += `\t\t\t.uri(URI.create("${ctx.url}"))\n`;

  for (const [k, v] of Object.entries(headers)) {
    code += `\t\t\t.header("${k}", "${v}")\n`;
  }

  code += `\t\t\t.${ctx.method.toLowerCase()}("${body}")\n`;
  code += `\t\t\t.build();\n\n`;
  code += `\t\tHttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());\n`;
  code += `\t\tSystem.out.println(response.body());\n`;
  code += `\t}\n`;
  code += `}`;
  return code;
}
