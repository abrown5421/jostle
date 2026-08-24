const JOIN_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const JOIN_CODE_LENGTH = 6;

export function generateJoinCode(random: () => number = Math.random): string {
  let code = '';
  for (let i = 0; i < JOIN_CODE_LENGTH; i++) {
    code += JOIN_CODE_ALPHABET[Math.floor(random() * JOIN_CODE_ALPHABET.length)];
  }
  return code;
}
