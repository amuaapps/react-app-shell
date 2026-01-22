function HomePage() {
  return (
    <div className="home-page">
      <h2>Welcome to React App Shell</h2>
      <p>
        This is a placeholder page. The shell will mount micro-frontend apps:
      </p>
      <ul>
        <li>
          <strong>/campaigns/**</strong> → react-app-campaigns (remote app)
        </li>
        <li>
          <strong>/**</strong> (all other routes) → react-app-core (remote app)
        </li>
      </ul>
      <p>
        The shell renders TopNavigation and Footer from @amuaapps/ui-library and
        applies tokens from @amuaapps/ui-theme-core.
      </p>
    </div>
  );
}

export default HomePage;
