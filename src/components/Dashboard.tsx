import { Link } from "react-router-dom";

function Home() {
  return (
    <>
      <div>
        <h1>This is an pdf parser</h1>
        <Link to="/upload">
          <button>Upload</button>
        </Link>
      </div>
    </>
  );
}

export default Home;
