export { arrayShallowEqual };

function arrayShallowEqual<const TArr extends readonly unknown[]>(
  arr1: TArr,
  arr2: readonly unknown[]
): arr2 is TArr {
  if (arr1.length !== arr2.length) {
    return false;
  }
  for (let i = 0; i < arr1.length; ++i) {
    if (arr1[i] !== arr2[i]) {
      return false;
    }
  }
  return true;
}
