import { NavLink } from 'react-router-dom'
import './NavBar.css'

export default function NavBar() {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    'nav-link' + (isActive ? ' active' : '')

  return (
    <nav className="nav">
      <div className="brand">WIMS</div>
      <ul className="nav-list">
        <li><NavLink className={linkClass} to="/">Home</NavLink></li>
        <li><NavLink className={linkClass} to="/species">Species</NavLink></li>
        <li><NavLink className={linkClass} to="/sightings">Sightings</NavLink></li>
        <li><NavLink className={linkClass} to="/reserves">Reserves</NavLink></li>
        <li><NavLink className={linkClass} to="/hunters">Hunters</NavLink></li>
        <li><NavLink className={linkClass} to="/licences">Licences</NavLink></li>
        <li><NavLink className={linkClass} to="/poaching">Poaching</NavLink></li>
        <li><NavLink className={linkClass} to="/quotas">Quotas</NavLink></li>
      </ul>
    </nav>
  )
}
