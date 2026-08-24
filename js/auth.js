function doLogin() {
  const l = document.getElementById('loginInput').value.trim();
  const p = document.getElementById('passwordInput').value.trim();
  if (l === 'Admin' && p === 'Admin') {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('app').style.display = 'flex';
    initApp();
  } else {
    document.getElementById('loginError').style.display = 'block';
  }
}
function doLogout() {
  document.getElementById('app').style.display = 'none';
  document.getElementById('loginScreen').style.display = 'flex';
  document.getElementById('loginError').style.display = 'none';
  document.getElementById('passwordInput').value = '';
}
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('passwordInput').addEventListener('keypress', e => { if (e.key === 'Enter') doLogin(); });
});