module.exports = ({ config }) => {
  // Direct client access is enabled for the owner's private distribution.
  // EXPO_PUBLIC_GEMINI_API_KEY is embedded in the app and is not a secret.
  const profile = process.env.EAS_BUILD_PROFILE;
  // Metro serves this manifest during local development. This fallback avoids
  // relying exclusively on Expo's virtual env module in a running dev client.
  // Do not include it in EAS binaries or production exports.
  const extra = { ...config.extra };
  delete extra.localGeminiApiKey;
  if (
    process.env.NODE_ENV === "development" &&
    !profile &&
    !process.env.EAS_BUILD
  ) {
    const key = process.env.EXPO_PUBLIC_GEMINI_API_KEY?.trim();
    if (key) extra.localGeminiApiKey = key;
  }
  return { ...config, extra };
};
