export default async function handler(req, res) {
  try {
    const username = "barhum915";
    const url = `https://api.github.com/users/${username}/repos?sort=updated&per_page=9`;

    const r = await fetch(url, {
      headers: {
        "User-Agent": "portfolio",
        "Accept": "application/vnd.github+json",
      },
    });

    if (!r.ok) {
      const txt = await r.text();
      return res.status(r.status).json({ error: txt });
    }

    const data = await r.json(); // لازم تكون Array
    return res.status(200).json(data);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}