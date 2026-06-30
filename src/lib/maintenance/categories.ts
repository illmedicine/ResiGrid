export interface MaintenanceCategory {
  id: string;
  label: string;
  items: string[];
}

export const MAINTENANCE_CATEGORIES: MaintenanceCategory[] = [
  {
    id: "plumbing",
    label: "Plumbing",
    items: [
      "Sink",
      "Toilet",
      "Shower / Tub",
      "Water heater",
      "Garbage disposal",
      "Leak / drip",
    ],
  },
  {
    id: "electrical",
    label: "Electrical",
    items: ["Outlets", "Light fixtures", "Breaker / fuse", "Wiring"],
  },
  {
    id: "hvac",
    label: "Heating & Cooling",
    items: ["Heating", "Air conditioning", "Thermostat", "Ventilation"],
  },
  {
    id: "appliances",
    label: "Appliances",
    items: [
      "Refrigerator",
      "Stove / Oven",
      "Dishwasher",
      "Washer",
      "Dryer",
      "Microwave",
    ],
  },
  {
    id: "structural",
    label: "Structural",
    items: [
      "Doors",
      "Windows",
      "Walls",
      "Flooring",
      "Ceiling / roof leak",
    ],
  },
  {
    id: "pest_control",
    label: "Pest Control",
    items: ["Insects", "Rodents", "Other pests"],
  },
  {
    id: "common_areas",
    label: "Common Areas",
    items: ["Hallway", "Parking lot", "Laundry room", "Elevator", "Mailbox"],
  },
  {
    id: "safety_security",
    label: "Safety & Security",
    items: [
      "Smoke detector",
      "Carbon monoxide detector",
      "Locks",
      "Exterior lighting",
    ],
  },
  {
    id: "other",
    label: "Other",
    items: ["Other"],
  },
];
