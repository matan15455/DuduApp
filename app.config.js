module.exports = ({ config }) => {
  if (process.env.EXPO_PUBLIC_GEMINI_API_KEY?.trim()) {
    throw new Error(
      "Remove EXPO_PUBLIC_GEMINI_API_KEY from local and EAS environments. Gemini now runs only in the import Worker.",
    );
  }
  const extra = { ...config.extra };
  delete extra.localGeminiApiKey;
  return { ...config, extra };
};
