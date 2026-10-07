export const DEFAULT_AVATARS = {
  female: '/default-avatars/female-niqab.svg',
  male: '/default-avatars/male-beard.svg',
};

export function getDefaultAvatar(gender) {
  const value = String(gender || '').trim().toLowerCase();

  if (['female', 'woman', 'girl', 'f'].some(keyword => value.includes(keyword))) {
    return DEFAULT_AVATARS.female;
  }

  if (['male', 'man', 'boy', 'm'].some(keyword => value.includes(keyword))) {
    return DEFAULT_AVATARS.male;
  }

  return DEFAULT_AVATARS.male;
}

export function getPersonAvatar(person, fallbackGender = '') {
  if (person?.photo_url) return person.photo_url;
  return getDefaultAvatar(person?.gender || fallbackGender);
}
