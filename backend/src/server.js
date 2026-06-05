import 'dotenv/config';
import { app } from './app.js';

app.get("/", (req, res) => {
  res.json({
    status: "OK",
    message: "TalentForge API running"
  });
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`TalentForge API running on http://localhost:${PORT}`);
});
