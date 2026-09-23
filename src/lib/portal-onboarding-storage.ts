type OnboardingStorage = Pick<Storage, "getItem" | "setItem">

export function resolveOnboardingVisit(
  key: string,
  persistentStorage: OnboardingStorage,
  visitStorage: OnboardingStorage
) {
  const repeat = persistentStorage.getItem(`${key}:repeat`) === "1"
  const seen = persistentStorage.getItem(`${key}:seen`) === "1"
  const shownThisVisit = visitStorage.getItem(`${key}:session`) === "1"
  const shouldShow = (!seen || repeat) && !shownThisVisit

  if (shouldShow) {
    persistentStorage.setItem(`${key}:seen`, "1")
    visitStorage.setItem(`${key}:session`, "1")
  }

  return { repeat, shouldShow }
}
