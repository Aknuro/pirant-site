const assets = import.meta.glob<string>('./assets/**/*', {
  eager: true,
  query: '?url',
  import: 'default',
});

const bundledAssets: Record<string, string> = Object.fromEntries(
  Object.entries(assets).map(([sourcePath, url]) => [
    sourcePath.replace('./assets', ''),
    url,
  ]),
);

export function assetUrl(path: string): string {
  return bundledAssets[path] ?? path;
}
