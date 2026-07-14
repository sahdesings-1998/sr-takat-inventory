import Settings from "../models/Settings.js";

async function getSettings() {
  return Settings.getSettings();
}

async function updateSettings(data) {
  let settings = await Settings.findOne();
  if (!settings) {
    settings = new Settings(data);
  } else {
    Object.assign(settings, data);
  }
  return settings.save();
}

export default {
  getSettings,
  updateSettings,
};
