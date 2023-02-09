// Contenu du pied de page
function Footer() {
  const yearNow = new Date().getFullYear();

  return (
    <footer id="footer" className="container">
      <div className="row">
        <div className="column text-center valign-center">
          &copy; OKKI DOKI &emsp; 2022 - {yearNow}
        </div>
      </div>
    </footer>
  );
}
  
export default Footer;