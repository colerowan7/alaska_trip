'use strict';

const DAYS = [
  {
    date: 'Sat 5/30', city: 'Seattle', icon: 'ti-plane-arrival', subtitle: 'Arrival Day',
    packing: ['Passport', 'Confirmation emails', 'Comfy travel clothes', 'Snacks for flight', 'Earbuds'],
    defaultTodos: ['Confirm hotel check-in', 'Download offline maps for Seattle', 'Pack carry-on only', 'Set flight alarms'],
    events: [
      { time: '10:20 AM', type: 'travel',  icon: 'ti-plane',               title: 'Flight CRP → DFW',        note: '10:20–11:56 AM' },
      { time: '1:14 PM',  type: 'travel',  icon: 'ti-plane',               title: 'Flight DFW → SEA',        note: '1:14–3:42 PM · 1 hr layover DFW' },
      { time: '~5:00 PM', type: 'misc',    icon: 'ti-car',                 title: 'Uber to hotel',           note: '' },
      { time: '6:00 PM',  type: 'misc',    icon: 'ti-building',            title: 'Check in to hotel',       note: '' },
      { time: 'Evening',  type: 'misc',    icon: 'ti-building-skyscraper', title: 'Evening in Seattle',      note: 'Explore the city' },
    ],
  },
  {
    date: 'Sun 5/31', city: 'Seattle', icon: 'ti-anchor', subtitle: 'Embarkation Day',
    packing: ['Boarding documents', 'Cruise card', 'Luggage tags', 'Change of clothes in carry-on', 'Sunscreen'],
    defaultTodos: ['Print / download boarding pass', 'Attach luggage tags before leaving hotel', 'Check muster station assignment', 'Download Princess app'],
    events: [
      { time: 'Morning',   type: 'misc',    icon: 'ti-coffee',         title: 'Breakfast at hotel',            note: 'Get ready' },
      { time: '~10:00 AM', type: 'misc',    icon: 'ti-car',            title: 'Uber to Pier 91',               note: '' },
      { time: '11:00 AM',  type: 'onboard', icon: 'ti-ship',           title: 'Embarkation — Star Princess',   note: '11:00–11:30 AM · Pier 91' },
      { time: '11:30 AM',  type: 'onboard', icon: 'ti-door-enter',     title: 'Tour ship & check in to cabin', note: 'Get settled, find muster station' },
      { time: '3:00 PM',   type: 'onboard', icon: 'ti-anchor',         title: 'Ship embarks!',                 note: '' },
      { time: '5:00 PM',   type: 'dinner',  icon: 'ti-tools-kitchen-2',title: 'Dinner @ Aurora',               note: '' },
      { time: 'Evening',   type: 'onboard', icon: 'ti-stars',          title: 'Evening activities',            note: 'Check Ship Patter Sheet' },
    ],
  },
  {
    date: 'Mon 6/1', city: 'At Sea', icon: 'ti-waves', subtitle: 'Full Day at Sea',
    packing: ['Swimsuit', 'Sunscreen', 'Book / Kindle', 'Sea-sickness meds (just in case)', 'Light layers'],
    defaultTodos: ['Book Craig massage time', 'Review Patter Sheet for evening shows', 'Check excursion times for Ketchikan', "Confirm Butcher's Block reservation"],
    events: [
      { time: 'Morning',   type: 'misc',    icon: 'ti-massage',         title: 'Craig Massage',             note: 'Time TBD — book ahead' },
      { time: 'Afternoon', type: 'onboard', icon: 'ti-ship',            title: 'Full day at sea',           note: 'Explore ship, pools, activities' },
      { time: '5:20 PM',   type: 'dinner',  icon: 'ti-tools-kitchen-2', title: "Dinner @ Butcher's Block",  note: 'Changed from Celestial' },
      { time: 'Evening',   type: 'onboard', icon: 'ti-stars',           title: 'Evening activities',        note: 'Check Ship Patter Sheet' },
    ],
  },
  {
    date: 'Tue 6/2', city: 'Ketchikan', icon: 'ti-map-pin', subtitle: "Alaska's First City",
    packing: ['Rain jacket', 'Waterproof shoes', 'Camera', 'Cash for tips', 'Layers'],
    defaultTodos: ['Confirm Lumberjack Show tickets', 'Bring cash for port shops', 'Charge camera battery', 'Note ship departure time'],
    events: [
      { time: '6:30 AM',  type: 'excursion', icon: 'ti-anchor',           title: 'Arrive Ketchikan, Alaska',  note: '' },
      { time: '7:00 AM',  type: 'excursion', icon: 'ti-camera',           title: 'Photos around port',        note: '7:00–10:30 AM' },
      { time: '11:00 AM', type: 'excursion', icon: 'ti-axe',              title: 'Lumberjack Show',           note: '11:00 AM–12:30 PM' },
      { time: '12:30 PM', type: 'excursion', icon: 'ti-walk',             title: 'Walk around town',          note: '12:30–3:00 PM' },
      { time: '4:50 PM',  type: 'dinner',    icon: 'ti-tools-kitchen-2',  title: 'Dinner @ Umai Teppanyaki',  note: '' },
      { time: 'Evening',  type: 'onboard',   icon: 'ti-stars',            title: 'Evening activities',        note: 'Check Ship Patter Sheet' },
    ],
  },
  {
    date: 'Wed 6/3', city: 'Juneau', icon: 'ti-mountain', subtitle: "Alaska's Capital",
    packing: ['Warm layers', 'Binoculars', 'Rain gear', 'Good walking shoes', 'Camera'],
    defaultTodos: ['Decide: dinner in Juneau or on ship?', 'Look up Mendenhall Glacier options', 'Note ship curfew — 8:30 PM', 'Bring binoculars for glacier views'],
    events: [
      { time: '5:00 AM',  type: 'excursion', icon: 'ti-mountain',         title: "Glacier Nat'l Park views",  note: '5:00–9:00 AM · Stay on boat' },
      { time: '12:30 PM', type: 'excursion', icon: 'ti-map-2',            title: 'Juneau, Alaska — in port',  note: '12:30–9:00 PM' },
      { time: '5:00 PM',  type: 'dinner',    icon: 'ti-tools-kitchen-2',  title: 'Dinner @ Aurora or Juneau', note: 'TBD — decide before docking' },
      { time: '8:30 PM',  type: 'onboard',   icon: 'ti-ship',             title: 'Board ship',                note: "Don't miss it!" },
      { time: 'Evening',  type: 'onboard',   icon: 'ti-stars',            title: 'Evening activities',        note: 'Check Ship Patter Sheet' },
    ],
  },
  {
    date: 'Thu 6/4', city: 'Skagway', icon: 'ti-train', subtitle: 'Gateway to the Klondike',
    packing: ['Warmest jacket', 'Sturdy boots', 'Gloves', 'Camera', 'Cash for tips'],
    defaultTodos: ["Confirm Musher's Camp booking", 'Bring tip cash for guide', 'Wear warmest layers', 'Note ship departure: 4:30 PM', 'Clarify dinner: The Catch or Crown Grill?'],
    events: [
      { time: '6:00 AM',  type: 'excursion', icon: 'ti-anchor',           title: 'Skagway, Alaska — in port', note: 'All day' },
      { time: '10:30 AM', type: 'excursion', icon: 'ti-paw',              title: "Musher's Camp",             note: '10:30 AM–1:45 PM' },
      { time: '4:30 PM',  type: 'onboard',   icon: 'ti-ship',             title: 'Board ship',                note: '' },
      { time: '6:20 PM',  type: 'dinner',    icon: 'ti-tools-kitchen-2',  title: 'Dinner @ The Catch',        note: '' },
      { time: '7:20 PM',  type: 'dinner',    icon: 'ti-tools-kitchen-2',  title: 'Dinner @ Crown Grill',      note: 'Confirm which is the right one' },
      { time: 'Evening',  type: 'onboard',   icon: 'ti-stars',            title: 'Evening activities',        note: 'Check Ship Patter Sheet' },
    ],
  },
  {
    date: 'Fri 6/5', city: 'At Sea', icon: 'ti-waves', subtitle: 'Full Day at Sea',
    packing: ['Swimsuit', 'Good book', 'Formal outfit if formal night', 'Sunscreen', 'Comfy shoes'],
    defaultTodos: ['Book Craig massage time', 'Pack bags tonight for disembarkation', 'Check out any spa deals', 'Review Victoria arrival time'],
    events: [
      { time: 'Morning',  type: 'misc',    icon: 'ti-massage',            title: 'Craig Massage',         note: 'Time TBD — book ahead' },
      { time: 'All day',  type: 'onboard', icon: 'ti-ship',               title: 'Relaxing day at sea',   note: 'Pools, activities, shows' },
      { time: 'Evening',  type: 'onboard', icon: 'ti-stars',              title: 'Evening activities',    note: 'Check Ship Patter Sheet' },
    ],
  },
  {
    date: 'Sat 6/6', city: 'Victoria', icon: 'ti-building-castle', subtitle: 'British Columbia, Canada',
    packing: ['Light jacket', 'Walking shoes', 'Camera', 'Passport', 'Evening wear'],
    defaultTodos: ['Note: in port 7 PM–midnight only', 'Research Victoria highlights in advance', 'Confirm 11:30 PM ship boarding', 'Check passport for Canada re-entry'],
    events: [
      { time: '5:00 PM',  type: 'dinner',    icon: 'ti-tools-kitchen-2',  title: 'Dinner @ Aurora',       note: 'On ship before heading into port' },
      { time: '7:00 PM',  type: 'excursion', icon: 'ti-building-castle',  title: 'Victoria, Canada',      note: '7:00 PM–11:59 PM in port' },
      { time: '11:30 PM', type: 'onboard',   icon: 'ti-ship',             title: 'Board ship',            note: '' },
    ],
  },
  {
    date: 'Sun 6/7', city: 'Seattle', icon: 'ti-plane-departure', subtitle: 'Disembarkation Day',
    packing: ['Everything packed the night before', 'Carry-on with flight essentials', 'Flight documents', 'Snacks'],
    defaultTodos: ['Pack all bags the night before', 'Set early alarm', 'Confirm Uber to airport', 'Decide what to do with 6hr gap', 'Check flight status morning of'],
    events: [
      { time: '7:00 AM',   type: 'misc',   icon: 'ti-anchor',          title: 'Dock in Seattle',          note: '' },
      { time: 'Morning',   type: 'misc',   icon: 'ti-door-exit',        title: 'Disembark & transfer',     note: '' },
      { time: 'All day',   type: 'misc',   icon: 'ti-clock-question',   title: '~6 hours until flight',    note: 'Uber somewhere — TBD' },
      { time: '3:45 PM',   type: 'travel', icon: 'ti-plane',            title: 'Flight SEA → DFW',         note: '3:45–9:50 PM' },
      { time: '~10:00 PM', type: 'travel', icon: 'ti-plane',            title: 'Layover DFW',              note: '40 minutes' },
      { time: '10:30 PM',  type: 'travel', icon: 'ti-plane',            title: 'Flight DFW → CRP',         note: '10:30–11:59 PM · Home!' },
    ],
  },
];
