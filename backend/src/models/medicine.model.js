import mongoose from "../config/db.js";

const medicineSchema = new mongoose.Schema({
  id: Number,
  name: String,
  "price(₹)": Number,
  Is_discontinued: Boolean,
  manufacturer_name: String,
  type: String,
  pack_size_label: String,
  short_composition1: String,
  short_composition2: String,
}, { collection: "medicines" }); // add collection name explicitly

const Medicine = mongoose.model("Medicine", medicineSchema);
export default Medicine;
