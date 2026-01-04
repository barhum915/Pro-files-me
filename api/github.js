module.exports = async (req, res) => {
  try {
    const r = await fetch(
      "https://api.github.com/users/barhum915/repos?sort=updated&per_page=6"
    );
    const data = await r.json();
    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};