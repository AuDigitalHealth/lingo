import { useNavigate } from 'react-router-dom';

function Logout() {
  const navigate = useNavigate();
  console.log('logout';)
  function handleLogout() {
    fetch('api/auth/logout', { method: 'POST' }).then(res => {
      if (res.status === 200) {
        navigate('/');
      }
    });
  }
  return <button onClick={handleLogout}>Logout</button>;
}

export default Logout;
