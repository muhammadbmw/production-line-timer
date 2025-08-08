import Build from '../models/Build.js';

export const getBuild = async (req, res) => {
    try {
    const build = await Build.findOne({ buildNumber: req.params.buildNumber });
    if (!build) return res.status(404).json({ error: 'Build not found' });
    res.status(200).json(build);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}