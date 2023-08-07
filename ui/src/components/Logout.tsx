import { useNavigate } from 'react-router-dom';

function Logout() {
  const navigate = useNavigate();
  function handleLogout() {
    fetch('api/auth/logout', { method: 'POST' })
      .then(res => {
        if (res.status === 200) {
          navigate('/');
        }
      })
      .catch(err => {
        // TODO: fix me
        console.log(err);
      });
  }
  return <button onClick={handleLogout}>Logout</button>;
}

export default Logout;
