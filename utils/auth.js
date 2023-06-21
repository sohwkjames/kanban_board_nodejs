function isValidPassword(password) {
  // regex test for contain at least 1 character, 1 special char, 1 number
  const regex = /^(?=.*\d)(?=(.*\W))(?=.*[a-zA-Z])(?!.*\s).{1,15}$/;

  if (password.length > 10 || password.length < 8) {
    return false;
  }

  return regex.test(password);
}

module.exports = { isValidPassword };
