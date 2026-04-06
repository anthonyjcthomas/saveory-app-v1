import { collection, setDoc, doc, writeBatch, serverTimestamp } from "firebase/firestore"; // Firestore imports
import { db, auth } from './firebaseConfigNode.js'; // Firebase config import
import { signInWithEmailAndPassword } from "firebase/auth"; // Import Firebase authentication


const establishments = [
    {
        "id": "1",
        "name": "Estacion Inka",
        "image": "https://bloximages.chicago2.vip.townnews.com/madison.com/content/tncms/assets/v3/editorial/a/df/adfc24d5-79d3-5bfe-a725-71292f8e7263/5e42c7c8cffe4.image.jpg?resize=1200%2C900",
        "description": "A student-favorite casual Peruvian restaurant in downtown Madison, offering exciting and delicious flavors that come in large portions, including an amazing Pollo a la Brasa!",
        "rating": "4.5",
        "location": "616 University Ave, Madison, WI 53715",
        "happy_hour_deals": [
          {
            "day": "Monday-Friday",
            "details": "12:00-4:00PM: Lunch specials including a quarter pound of Pollo a la Brasa with a choice of sides, or Salchipapas and french fries mixed together for $8.99.",
            "start_time": "12:00",
            "end_time": "16:00",
            "deal_list": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
          }
        ],
        "latitude": "43.0733778",
        "longitude": "-89.3965424",
        "category": ["Meals"],
        "dotw": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        "cuisine": "Peruvian"
      },
      {
        "id": "2",
        "name": "Kollege Klub",
        "image": "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/0c/59/0d/73/kk.jpg?w=1200&h=-1&s=1",
        "description": "Historic college-town watering hole & game-day joint with a vintage tavern vibe & classic pub eats.",
        "rating": "3.9",
        "location": "529 N Lake St, Madison, WI 53703",
        "happy_hour_deals": [
          {
            "day": "Tuesday-Thursday",
            "details": "6:00-8:00PM: $15 Cheeseburger Basket and Bottomless Tap Beer.",
            "start_time": "18:00",
            "end_time": "20:00",
            "deal_list": ["Tuesday", "Wednesday", "Thursday"]
          },
          {
            "day": "Friday",
            "details": "1:00-8:00PM: $3 Fireball Shots, $1 Grilled Cheese, $1-$3 White Claws (depending on time).",
            "start_time": "13:00",
            "end_time": "20:00",
            "deal_list": ["Friday"]
          },
          {
            "day": "Sunday",
            "details": "6:00PM-Close: Free Darts, $2.50 Long Islands, $3 Truly’s, $3 Sun Cruisers, $5 Chicken Tender Baskets.",
            "start_time": "18:00",
            "end_time": "Close",
            "deal_list": ["Sunday"]
          }
        ],
        "latitude": "43.075924",
        "longitude": "-89.399024",
        "category": ["Drinks", "Combos"],
        "dotw": ["Tuesday", "Wednesday", "Thursday", "Friday", "Sunday"],
        "cuisine": "American"
      },{
        "id": "3",
        "name": "The Old Fashioned",
        "image": "https://fastly.4sqi.net/img/general/600x600/151703384_SmJh_wURkohQ7nOu8yolwyLNDhsrKNKHbVHRsV-yliY.jpg",
        "description": "Wisconsin-themed, retro-style tavern offering beers, brats & cheese curds (all sourced in-state).",
        "rating": "4.1",
        "location": "23 N Pinckney St #1, Madison, WI 53703",
        "happy_hour_deals": [
          {
            "day": "Monday-Thursday",
            "details": "4:00-6:00PM: $2 OFF brandy old fashions and select tap beers.",
            "start_time": "16:00",
            "end_time": "18:00",
            "deal_list": ["Monday", "Tuesday", "Wednesday", "Thursday"]
          }
        ],
        "latitude": "43.0762771",
        "longitude": "-89.3835835",
        "category": ["Drinks"],
        "dotw": ["Monday", "Tuesday", "Wednesday", "Thursday"],
        "cuisine": "American"
      },
      {
        "id": "4",
        "name": "Merchant",
        "image": "https://lh3.googleusercontent.com/p/AF1QipMwrGIL2NqsUxiwtWyZo8VmuOlxfS7ZAKpR3Bwm=s1360-w1360-h1020",
        "description": "Industrial-chic gastropub & liquor store serving farm-to-table New American fare & craft cocktails.",
        "rating": "3.9",
        "location": "121 S Pinckney St, Madison, WI 53703",
        "happy_hour_deals": [
          {
            "day": "Monday-Sunday",
            "details": "4:00-6:00PM: 50% OFF draft cocktails, 20% OFF classic cocktails, buy one get one wine by the glass, and 20% OFF bar snacks, $3 Lawnmower beers, $6 Boilermakers.",
            "start_time": "16:00",
            "end_time": "18:00",
            "deal_list": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
          }
        ],
        "latitude": "43.0742378",
        "longitude": "-89.3810119",
        "category": ["Drinks", "Appetizers"],
        "dotw": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        "cuisine": "New American"
      },
      {
        "id": "5",
        "name": "Tavernakaya",
        "image": "https://images.squarespace-cdn.com/content/v1/59651623d482e9030f764c54/1596666231928-4DFVYXWHSFUCH6IRFNRS/Tavernakaya+Storefront.jpeg",
        "description": "Test owls & Japanese tapas along with local & Asian beers.",
        "rating": "3.6",
        "location": "27 E Main St, Madison, WI 53703",
        "happy_hour_deals": [
          {
            "day": "Monday-Friday",
            "details": "4:30-6:00PM: Half off House Sake, All Wines, and Rail Mixers, $4 Draft Sapporo and Spotted, and $5 Sushi Rolls, Popcorn Chicken, Handcut Fries, Loaded Vegggie Spring Roll, California Roll, Spicy Tuna Roll, Avacado Roll, Cucumber Roll, and Edamame.",
            "start_time": "16:30",
            "end_time": "18:00",
            "deal_list": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
          }
        ],
        "latitude": "43.0743595",
        "longitude": "-89.3820804",
        "category": ["Drinks", "Appetizers"],
        "dotw": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        "cuisine": "Japanese"
      },
      {
        "id": "6",
        "name": "The Coopers Tavern",
        "image": "https://assets.simpleviewinc.com/simpleview/image/upload/c_fill,f_jpg,h_685,q_75,w_1024/v1/crm/madison/015_CT_Interiors_TH17_84D267D5-5056-A36A-08213BF67EAF29B7-84d2673e5056a36_84d26833-5056-a36a-0877aacb22906135.jpg",
        "description": "Upscale Irish tavern serving pub grub & international beer & wine in a warm, contemporary venue.",
        "rating": "3.9",
        "location": "20 W Mifflin St, Madison, WI 53703",
        "happy_hour_deals": [
          {
            "day": "Monday-Friday",
            "details": "3:00-6:00PM: $25 bottles of wine, 25% OFF growlers, $2 off appetizers, draft beers, and craft cocktails.",
            "start_time": "15:00",
            "end_time": "18:00",
            "deal_list": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
          }
        ],
        "latitude": "43.0751039",
        "longitude": "-89.3861343",
        "category": ["Drinks", "Appetizers"],
        "dotw": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        "cuisine": "Irish"
      },
      {
        "id": "7",
        "name": "Lucille",
        "image": "https://static.wixstatic.com/media/50d0a5_ff180554c80a41e1bfa7a708bc19050d~mv2.jpg/v1/fill/w_1960,h_996,al_c/50d0a5_ff180554c80a41e1bfa7a708bc19050d~mv2.jpg",
        "description": "Vintage, industrial-chic tavern with 3 floors serving wood-fired & steel-pan pizzas, plus cocktails.",
        "rating": "3.9",
        "location": "101 King St, Madison, WI 53703",
        "happy_hour_deals": [
          {
            "day": "Monday-Sunday",
            "details": "3:00-6:00PM: 50% off all classic drinks.",
            "start_time": "15:00",
            "end_time": "18:00",
            "deal_list": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
          },
          {
            "day": "Monday",
            "details": "50% off all cocktails starting with the letter 'M' (Margarita, Mojito, Moscow Mule).",
            "start_time": "3:00",
            "end_time": "23:59",
            "deal_list": ["Monday"]
          },
          {
            "day": "Wednesday",
            "details": "5:00-10:00PM: Date Night Specials.",
            "start_time": "17:00",
            "end_time": "22:00",
            "deal_list": ["Wednesday"]
          },
          {
            "day": "Friday",
            "details": "3:00-4:00PM: Free pizza at the bar.",
            "start_time": "15:00",
            "end_time": "16:00",
            "deal_list": ["Friday"]
          }
        ],
        "latitude": "43.0744",
        "longitude": "-89.3814",
        "category": ["Drinks", "Meals"],
        "dotw": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        "cuisine": "New American"
      },{
        "id": "8",
        "name": "A La Brasa Mexican Grill",
        "image": "https://lh3.googleusercontent.com/p/AF1QipOw7YHqflQJpd5Ti8kA1PPNgHMzWfoSTFR555tK=s1360-w1360-h1020",
        "description": "Mole poblano, fajitas & other Mexican favorites doled out in a simple, brightly colored setting.",
        "rating": "4.4",
        "location": "15 N Broom St, Madison, WI 53703",
        "happy_hour_deals": [
          {
            "day": "Everyday",
            "details": "Spend $25, get a free soda. 20 tacos for $40.",
            "start_time": "11:00",
            "end_time": "21:00",
            "deal_list": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
          }
        ],
        "latitude": "43.071850",
        "longitude": "-89.389040",
        "category": ["Meals"],
        "dotw": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        "cuisine": "Mexican"
      },
      {
        "id": "9",
        "name": "Bandit - Tacos & Coffee",
        "image": "https://lh3.googleusercontent.com/p/AF1QipMW1ap0vGtBWpnBafWc1GsDVTTWf20KpNwsHz7h=s1360-w1360-h1020",
        "description": "Bandit is located on West Washington near the Kohl Center, offering freshly made tortillas, delicious fillings and incredible coffee!",
        "rating": "4.5",
        "location": "640 W Washington Ave, Madison, WI 53703",
        "happy_hour_deals": [
          {
            "day": "Everyday",
            "details": "3:00-5:00PM: $6 Margaritas, $3 Bandito Tacos, $3 Mexican Lagers, $2 Escabeche, $2 Tequila Shots, $1 Drip Coffee, Free Salsa with chips purchase.",
            "start_time": "15:00",
            "end_time": "17:00",
            "deal_list": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
          }
        ],
        "latitude": "43.068291",
        "longitude": "-89.394798",
        "category": ["Drinks", "Appetizers"],
        "dotw": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        "cuisine": "Mexican"
      },
      {
        "id": "10",
        "name": "The Mason Lounge",
        "image": "https://lh3.googleusercontent.com/p/AF1QipOx6mWsh3Gdh48m3v1UkL62FvdoGx4LYXGT3Jba=s1360-w1360-h1020",
        "description": "Boasting 15+ draft microbrews, this snug gathering place offers a mellow vibe & a long whiskey list.",
        "rating": "4.8",
        "location": "416 S Park St, Madison, WI 53715",
        "happy_hour_deals": [
          {
            "day": "Sunday",
            "details": "5:30PM-Close: $25 Medium pizza and a pitcher of beer (some taps excluded).",
            "start_time": "17:30",
            "end_time": "22:00",
            "deal_list": ["Sunday"]
          },
          {
            "day": "Everyday",
            "details": "Takeout Special: Grab a 4-pack, get $3 off with code 3OFF4. Buy a 6-pack, get $5 off with code 5OFF6.",
            "start_time": "15:00",
            "end_time": "23:59",
            "deal_list": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
          }
        ],
        "latitude": "43.062809",
        "longitude": "-89.401093",
        "category": ["Drinks", "Meals","Combos"],
        "dotw": ["Sunday"],
        "cuisine": "Pub-style"
      },
      {
        "id": "11",
        "name": "A8 China",
        "image": "https://s3-media0.fl.yelpcdn.com/bphoto/cmxd17caSlCgjRI31AYNxw/348s.jpg",
        "description": "Student hangout in a sparse setting for familiar Asian dishes, plus daily lunch & dinner specials.",
        "rating": "3.6",
        "location": "608 University Ave #1036, Madison, WI 53715",
        "happy_hour_deals": [
          {
            "day": "Everyday",
            "details": "All day: Lunch $8.99, Dinner $10.29, 10 regular sushi rolls for $49.",
            "start_time": "11:00",
            "end_time": "22:00",
            "deal_list": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
          }
        ],
        "latitude": "43.0733695",
        "longitude": "-89.3962468",
        "category": ["Meals"],
        "dotw": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        "cuisine": "Chinese"
      },
      {
        "id": "12",
        "name": "Sushi Express",
        "image": "https://lh3.googleusercontent.com/p/AF1QipNbry2Rg4z6eez7sWspzlJGmBsBPSB3TxZ_-2XP=s1360-w1360-h1020",
        "description": "Snug Japanese eatery featuring a menu that includes sushi, teriyaki & bento boxes, plus delivery.",
        "rating": "4.4",
        "location": "610 University Ave, Madison, WI 53715",
        "happy_hour_deals": [
          {
            "day": "Everyday",
            "details": "All day: Any 2 rolls for $10.95, any 3 rolls for $14.95.",
            "start_time": "11:00",
            "end_time": "21:45",
            "deal_list": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
          }
        ],
        "latitude": "43.0733711",
        "longitude": "-89.3963051",
        "category": ["Meals"],
        "dotw": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        "cuisine": "Sushi"
      },
      {
        "id": "13",
        "name": "The Borough Kitchen and Cocktails",
        "image": "https://lh3.googleusercontent.com/p/AF1QipMsP-cgErjBxeZxO_4-NkL88L4rwYFfBA3aMCDC=s1360-w1360-h1020",
        "description": "The Borough on South Park Street offers American cuisine alongside expertly crafted cocktails. Their menu caters to various tastes, with options for brunch, weekend fish fry, and happy hour.",
        "rating": "4.4",
        "location": "444 S Park St, Madison, WI 53715",
        "happy_hour_deals": [
          {
            "day": "Tuesday-Thursday",
            "details": "3:00-6:00PM: Half off House Cocktails, $6 Glasses of Wine, $2 off Pints, $3 Tacos (Carne Asada, Carnitas, Cauliflower).",
            "start_time": "15:00",
            "end_time": "18:00",
            "deal_list": ["Tuesday", "Wednesday", "Thursday"]
          }
        ],
        "latitude": "43.0628356",
        "longitude": "-89.400872",
        "category": ["Drinks", "Appetizers"],
        "dotw": ["Tuesday", "Wednesday", "Thursday"],
        "cuisine": "American"
      },  
      {
        "id": "14",
        "name": "The Weary Traveler Freehouse",
        "image": "https://lh3.googleusercontent.com/p/AF1QipPslmr8kwH6S6yH_cAwHkcFp3R70DguBHNzBadM=s1360-w1360-h1020",
        "description": "A beer-focused bar, elevated pub food & brunch plus board games in a vintage, hodgepodge setting.",
        "rating": "4.6",
        "location": "1201 Williamson St, Madison, WI 53703",
        "happy_hour_deals": [
          {
            "day": "Everyday",
            "details": "3:00-6:00PM & 10:00PM-Close: $5 Wine, Well Cocktails, Beer (Point Lager), and Shot (Well), $10 Baked Wings, $9 Bob’s Bad Breath Slider, $5 Basket of Fries, $10 Quesadilla, $7 Spinach Artichoke Dip, $7 Carne Asada Skewers, $7 Honey Citrus Chicken Skewers, $8 Candled Bacon Goat Cheese Bites, $7 Sweet Corn, $6 Small Plates: Hummus, South of the Border, Meat and Cheese, Fruit Platter.",
            "start_time": "15:00",
            "end_time": "18:00",
            "deal_list": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
          }
        ],
        "latitude": "43.083214",
        "longitude": "-89.3640003",
        "category": ["Drinks", "Appetizers"],
        "dotw": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        "cuisine": "American"
      },
      {
        "id": "15",
        "name": "Cento",
        "image": "https://images.otstatic.com/prod/25926432/1/huge.jpg",
        "description": "Farm-to-fork Italian restaurant with housemade pastas & wood-fired pizzas, plus a sizable wine list.",
        "rating": "4.5",
        "location": "122 W Mifflin St, Madison, WI 53703",
        "happy_hour_deals": [
          {
            "day": "Everyday",
            "details": "4:00-6:00PM: $5 Classic Italian Cocktails (Aperol Spritz, Grand Marnier Spritz, Cento Americano, Negroni Sbagliato, Classic Negroni, Carpano Antica), $3 Pints of Peroni, $10 Glasses of Wine (Rosé, Orange, White, Red).",
            "start_time": "16:00",
            "end_time": "18:00",
            "deal_list": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
          }
        ],
        "latitude": "43.0742625",
        "longitude": "-89.3873189",
        "category": ["Drinks"],
        "dotw": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        "cuisine": "Italian"
      },
      {
        "id": "16",
        "name": "Palette Bar & Grill",
        "image": "https://lh3.googleusercontent.com/p/AF1QipNYBRiAn23Y60dy6h-K__LoXeDow0ftXJvjV8s=s1360-w1360-h1020",
        "description": "Palette Bar & Grill offers a casual dining experience with an American-inspired menu featuring in-house cut steaks from the rich plains of Nebraska.",
        "rating": "4.4",
        "location": "901 E Washington Ave, Madison, WI 53703",
        "happy_hour_deals": [
          {
            "day": "Monday-Friday",
            "details": "4:00-6:00PM: $2 OFF Wine by the Glass and Palette cocktails.",
            "start_time": "16:00",
            "end_time": "18:00",
            "deal_list": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
          }
        ],
        "latitude": "43.082294",
        "longitude": "-89.373117",
        "category": ["Drinks"],
        "dotw": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        "cuisine": "Casual American"
      },
      {
        "id": "17",
        "name": "Butterbird",
        "image": "https://cdn.prod.website-files.com/6480c628ead1916bfa964f5c/666876ead0c979a536303bd4_DSC_7550copy.jpg",
        "description": "",
        "rating": "4.4",
        "location": "1134 Regent St, Madison, WI 53715",
        "happy_hour_deals": [
          {
            "day": "Tuesday-Friday",
            "details": "4:00-6:00PM: $6 Draft Cocktails, $2 Tall Boys, $5 Fried Pickles, and $5 Fried Chicken Sliders.",
            "start_time": "16:00",
            "end_time": "18:00",
            "deal_list": ["Tuesday", "Wednesday", "Thursday", "Friday"]
          },
          {
            "day": "Tuesday",
            "details": "All Day: $6 Popcorn Chicken with a choice of sauce.",
            "start_time": "11:00",
            "end_time": "21:00",
            "deal_list": ["Tuesday"]
          },
          {
            "day": "Wednesday",
            "details": "All Day: 6 Wings (Buffalo or Naked), Fries, Tall Boy or Soft Drink for $20.",
            "start_time": "11:00",
            "end_time": "21:00",
            "deal_list": ["Wednesday"]
          },
          {
            "day": "Saturday-Sunday",
            "details": "Two for One Mimosas & Bloodies available until 3:00PM.",
            "start_time": "11:00",
            "end_time": "21:00",
            "deal_list": ["Saturday", "Sunday"]
          },
          {
            "day": "Sunday",
            "details": "4:00-8:00PM: Family Meal Deal—Whole Chicken (fried or rotisserie), one Family Style Side, four Dinner Rolls, one Green Salad for $48.",
            "start_time": "16:00",
            "end_time": "20:00",
            "deal_list": ["Sunday"]
          }
        ],
        "latitude": "43.0678768",
        "longitude": "-89.4055202",
        "category": ["Drinks", "Meals", "Appetizers"],
        "dotw": ["Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        "cuisine": "American"
      },
      {
        "id": "18",
        "name": "Grampa’s Pizzeria",
        "image": "https://lh3.googleusercontent.com/p/AF1QipOaEWCqsLpS62InOLvrEKQTPLoPtfNBVyZsKQuB=s1360-w1360-h1020",
        "description": "Gourmet thin-crust pizza, wine, craft beer & desserts served in a cool space with an herb garden.",
        "rating": "4.5",
        "location": "1374 Williamson St, Madison, WI 53703",
        "happy_hour_deals": [
          {
            "day": "Tuesday",
            "details": "Date Night Special: 1 small plate or salad, 1 specialty pizza, 1 dessert, 1 bottle of wine all for $60.",
            "start_time": "16:00",
            "end_time": "21:00",
            "deal_list": ["Tuesday"]
          },
          {
            "day": "Wednesday",
            "details": "Wine Wednesday: All bottles of wine over $50 are 50% off.",
            "start_time": "16:00",
            "end_time": "21:00",
            "deal_list": ["Wednesday"]
          },
          {
            "day": "Sunday",
            "details": "Service Industry Sunday k: 20% off entire check for service industry friends.",
            "start_time": "16:00",
            "end_time": "21:00",
            "deal_list": ["Sunday"]
          }
        ],
        "latitude": "43.085552",
        "longitude": "-89.361446",
        "category": ["Drinks", "Appetizers", "Meals"],
        "dotw": ["Tuesday", "Wednesday", "Sunday"],
        "cuisine": "Italian"
      },
      {
        "id": "19",
        "name": "Sweet Home Wisconsin",
        "image": "https://s3-media0.fl.yelpcdn.com/bphoto/iEo8RJ5SVEwtJuWex3ioSw/348s.jpg",
        "description": "Pub plates, clever cocktails & craft draft beer served in laid-back surrounds with outdoor seating.",
        "rating": "4.6",
        "location": "910 Regent St, Madison, WI 53715",
        "happy_hour_deals": [
          {
            "day": "Tuesday-Friday",
            "details": "3:00-5:00PM: $2 off all appetizers, $1 off all drinks, $7 Duets (Shot & Beer Pairings).",
            "start_time": "15:00",
            "end_time": "17:00",
            "deal_list": ["Tuesday", "Wednesday", "Thursday", "Friday"]
          },
          {
            "day": "Tuesday",
            "details": "$12 Fancy Francheezie, $9 Chicago Dog, $7.50 Wisco Dog.",
            "start_time": "11:00",
            "end_time": "21:00",
            "deal_list": ["Tuesday"]
          },
          {
            "day": "Wednesday",
            "details": "Half Price Bottles of Wine, $1 off glasses of wine, $12.50 BB King, $11.50 Vegan Sausage.",
            "start_time": "11:00",
            "end_time": "21:00",
            "deal_list": ["Wednesday"]
          },
          {
            "day": "Thursday",
            "details": "$14.50 Jamboree Melt.",
            "start_time": "11:00",
            "end_time": "21:00",
            "deal_list": ["Thursday"]
          },
          {
            "day": "Friday",
            "details": "$13 Phish Fry Sandwich (with coleslaw & pub chips).",
           "start_time": "11:00",
            "end_time": "21:00",
            "deal_list": ["Friday"]
          },
          {
            "day": "Saturday",
            "details": "$14 Show Italian Beef, $16 Todd O’Connor.",
           "start_time": "11:00",
            "end_time": "21:00",
            "deal_list": ["Saturday"]
          },
          {
            "day": "Sunday",
            "details": "$8 Bloody Mary’s (with a snit & side car of garnishes), $2 off Boneless Wings.",
            "start_time": "11:00",
            "end_time": "21:00",
            "deal_list": ["Sunday"]
          }
        ],
        "latitude": "43.0677736",
        "longitude": "-89.401672",
        "category": ["Drinks", "Meals"],
        "dotw": ["Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        "cuisine": "American"
      },
      {
        "id": "20",
        "name": "DLUX",
        "image": "https://lh3.googleusercontent.com/p/AF1QipPRUtgdiDQd6ojGE6pl-nItA1dF4XDE5aahsxy_=s1360-w1360-h1020",
        "description": "Upscale haunt serving gourmet burgers & artisanal cocktails in a modern, trendy setting.",
        "rating": "4.3",
        "location": "117 Martin Luther King Jr Blvd, Madison, WI 53703",
        "happy_hour_deals": [
          {
            "day": "Sunday-Thursday",
            "details": "3:00-6:00PM: $10 basket of chicken tenders + ANY Tito’s cocktail, $5 Tito’s cocktails thereafter.",
            "start_time": "15:00",
            "end_time": "18:00",
            "deal_list": ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"]
          },
          {
            "day": "Friday-Saturday",
            "details": "9:00PM-Close: $10 basket of chicken tenders + ANY Tito’s cocktail, $5 Tito’s cocktails thereafter.",
            "start_time": "21:00",
            "end_time": "Close",
            "deal_list": ["Friday", "Saturday"]
          }
        ],
        "latitude": "43.0735991",
        "longitude": "-89.3823423",
        "category": ["Drinks", "Meals"],
        "dotw": ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        "cuisine": "American"
      },
      {
        "id": "21",
        "name": "Vintage Brewing Co. East",
        "image": "https://static1.squarespace.com/static/5e1f1ff3738ae851cb620d36/t/5e3367cb4b3cfb70442cd51f/1580427214685/Tangent_01.jpg?format=1500w",
        "description": "We’re a family owned and operated brewpub in beautiful Madison, Wisconsin, featuring “elevated Americana” cuisine and an eclectic array of highly-acclaimed house-made brews.",
        "rating": "4.5",
        "location": "803 E Washington Ave, Madison, WI 53703",
        "happy_hour_deals": [
          {
            "day": "Monday-Friday",
            "details": "2:00-5:00PM: $1.50 OFF VBC Taps < 7% abv, House Wine, Select Apps, House Cocktails, and Rail Mixers.",
            "start_time": "14:00",
            "end_time": "17:00",
            "deal_list": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
          },
          {
            "day": "Monday",
            "details": "5:00-10:00PM: $5 Margaritas, Mules, and Mojitos.",
            "start_time": "17:00",
            "end_time": "22:00",
            "deal_list": ["Monday"]
          },
          {
            "day": "Tuesday",
            "details": "5:00-10:00PM: BOGO select pints.",
            "start_time": "17:00",
            "end_time": "22:00",
            "deal_list": ["Tuesday"]
          },
          {
            "day": "Wednesday",
            "details": "5:00-10:00PM: Half off certain bottles of wine.",
            "start_time": "17:00",
            "end_time": "22:00",
            "deal_list": ["Wednesday"]
          },
          {
            "day": "Thursday",
            "details": "5:00-10:00PM: Half off select pitchers.",
            "start_time": "17:00",
            "end_time": "22:00",
            "deal_list": ["Thursday"]
          },
          {
            "day": "Friday",
            "details": "5:00-10:00PM: All-you-can-eat fish fry, $5 Old Fashions.",
            "start_time": "17:00",
            "end_time": "22:00",
            "deal_list": ["Friday"]
          }
        ],
        "latitude": "43.0811351",
        "longitude": "-89.3745516",
        "category": ["Drinks", "Meals"],
        "dotw": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        "cuisine": "American"
      },
      {
        "id": "22",
        "name": "Sequoia",
        "image": "https://bloximages.chicago2.vip.townnews.com/captimes.com/content/tncms/assets/v3/editorial/2/ac/2ac3e9c7-2adc-55f6-ae78-ba4b94f7f025/61d8a1a5002d6.image.jpg?resize=679%2C500",
        "description": "An upscale restaurant known for its elegant atmosphere and scenic views of the nearby lakes and landscape. It offers a range of traditional Italian dishes, fresh seafood, and a fine selection of wines.",
        "rating": "4.2",
        "location": "1843 Monroe St, Madison, WI 53711",
        "happy_hour_deals": [
          {
            "day": "Monday-Friday",
            "details": "4:00-6:00PM: $5 Gyoza, $4 Spicy Edamame, $3 Pork Bun, $7 Shrimp Tempura Roll, $11 Bluefin Tuna Nigiri, $9 Tiger Roll, $12 Chef’s Choice Roll. $3 Draft Beer, $4.50 Rosé, $7 Ruby, $8.50 Sequoia Old Fashion, $7 Ozeki “CLASSIC” 140 ml.",
            "start_time": "16:00",
            "end_time": "18:00",
            "deal_list": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
          }
        ],
        "latitude": "43.0648314",
        "longitude": "-89.4169059",
        "category": ["Drinks", "Appetizers"],
        "dotw": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        "cuisine": "Japanese"
      },
      {
        "id": "23",
        "name": "The Audrey Kitchen + Bar",
        "image": "https://lh3.googleusercontent.com/p/AF1QipPyLmkG91AxH2I_Kxq5Tdsd11Rs9wKJj4XNu854=s1360-w1360-h1020",
        "description": "The Audrey Kitchen + Bar is an upscale dining spot located in the Hilton Hotel. It offers modern American cuisine with a stylish ambiance, known for its cocktails and seasonal menu.",
        "rating": "4.5",
        "location": "9 E Wilson St, Madison, WI 53703",
        "happy_hour_deals": [
          {
            "day": "Friday",
            "details": "$20 Friday Fish Fry, $15 WhiteHaven Sauvignon Blanc, $7.50 Bottle/$8 Draft Spotted Cow.",
            "start_time": "17:00",
            "end_time": "23:00",
            "deal_list": ["Friday"]
          }
        ],
        "latitude": "43.0726208",
        "longitude": "-89.3810663",
        "category": ["Drinks", "Meals"],
        "dotw": ["Friday"],
        "cuisine": "American" 
      },
      {
        "id": "24",
        "name": "Bassett Street Brunch Club",
        "image": "https://media-cdn.tripadvisor.com/media/photo-m/1280/13/2c/e8/46/outside.jpg",
        "description": "Bassett Street Brunch Club is a casual restaurant offering a unique twist on brunch classics along with great drinks. Known for its comfortable diner atmosphere and vibrant menu.",
        "rating": "4.3",
        "location": "444 W Johnson St, Madison, WI 53703",
        "happy_hour_deals": [
          {
            "day": "Monday-Friday",
            "details": "4:00-6:00PM: $4 Rail Cocktails and Taps, $5 Glasses of Wine, Mimosas, and Frozen Cocktails, $6 Cheese Curds and Wings.",
            "start_time": "16:00",
            "end_time": "18:00",
            "deal_list": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
          },
          {
            "day": "Monday-Friday",
            "details": "8:00-9:00AM: $5 Early Bird Mimosa.",
            "start_time": "08:00",
            "end_time": "09:00",
            "deal_list": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
          }
        ],
        "latitude": "43.0728483",
        "longitude": "-89.392839",
        "category": ["Drinks", "Appetizers"],
        "dotw": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        "cuisine": "American"
      },
      {
        "id": "25",
        "name": "Gates & Brovi",
        "image": "https://gatesandbrovi.com/assets/gallery-photos/_629x423_crop_center-center_none/Gates_Brovi-013114-10.jpg",
        "description": "Gates & Brovi is a neighborhood favorite with a focus on seafood and American fare. Its relaxed setting, craft beers, and seafood dishes make it a popular spot in Madison.",
        "rating": "4.4",
        "location": "3502 Monroe St, Madison, WI 53711",
        "happy_hour_deals": [
          {
            "day": "Monday-Friday",
            "details": "4:00-6:00PM: Oyster Happy Hour—$2 Half-Dozen Oysters, $4 Paulaner Pils, $6 House Wines and Summer Crush.",
            "start_time": "16:00",
            "end_time": "18:00",
            "deal_list": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
          }
        ],
        "latitude": "43.0528519",
        "longitude": "-89.4355527",
        "category": ["Drinks",  "Appetizers"],
        "dotw": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        "cuisine": "Seafood"
      },      
      {
        "id": "26",
        "name": "The Library Cafe & Bar",
        "image": "https://lh3.googleusercontent.com/p/AF1QipP32eHqWUAOWCAi7ww-JtRtndQZeTHLIrpW_If3=s1360-w1360-h1020",
        "description": "The Library Cafe & Bar is a laid-back spot popular with students and locals. It offers a range of classic American bar food and drink specials, particularly during its generous happy hours.",
        "rating": "4.2",
        "location": "320 N Randall Ave, Madison, WI 53715",
        "happy_hour_deals": [
          {
            "day": "Monday-Friday",
            "details": "4:00-7:00PM: $4.50-$5.50 taps, $3.50 rail mixers, and $3 domestics.",
            "start_time": "16:00",
            "end_time": "19:00",
            "deal_list": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
          },
          {
            "day": "Monday",
            "details": "$6 Margaritas.",
            "start_time": "17:00",
            "end_time": "22:00",
            "deal_list": ["Monday"]
          },
          {
            "day": "Tuesday",
            "details": "Taco Tuesday! Choose between Chicken, Beef, or Pork and $5 Glasses of Wine.",
            "start_time": "17:00",
            "end_time": "23:00",
            "deal_list": ["Tuesday"]
          },
          {
            "day": "Wednesday",
            "details": "Happy Hour Taps All Night!",
            "start_time": "17:00",
            "end_time": "23:00",
            "deal_list": ["Wednesday"]
          },
          {
            "day": "Thursday",
            "details": "$5.50 Double Tito’s Mixers and $4.50 Double Captain Mixers.",
            "start_time": "23:00",
            "end_time": "23:00",
            "deal_list": ["Thursday"]
          },
          {
            "day": "Friday",
            "details": "4:00PM-Close: $4 Long Islands.",
            "start_time": "17:00",
            "end_time": "23:59",
            "deal_list": ["Friday"]
          }
        ],
        "latitude": "43.072985",
        "longitude": "-89.4091045",
        "category": ["Drinks", "Appetizers"],
        "dotw": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        "cuisine": "American"
      },
      {
        "id": "27",
        "name": "Jordan’s Big Ten Pub",
        "image": "https://big10pub.com/wp-content/uploads/sites/43/2018/05/IMG_1768-1024x612.jpeg",
        "description": "Jordan’s Big Ten Pub is a lively sports bar offering classic American dishes and drinks in a casual setting. It's a favorite spot for watching Badger games.",
        "rating": "4.3",
        "location": "1330 Regent St, Madison, WI 53715",
        "happy_hour_deals": [
          {
            "day": "Tuesday",
            "details": "Half off Burgers.",
            "start_time": "11:00",
            "end_time": "22:00",
            "deal_list": ["Tuesday"]
          },
          {
            "day": "Thursday",
            "details": "$1 Wings.",
            "start_time": "11:00",
            "end_time": "22:00",
            "deal_list": ["Thursday"]
          }
        ],
        "latitude": "43.067833",
        "longitude": "-89.4078947",
        "category": ["Appetizers", "Meals"],
        "dotw": ["Tuesday", "Thursday"],
        "cuisine": "American"
      },
      {
        "id": "28",
        "name": "Paul’s Pel’meni",
        "image": "https://lh3.googleusercontent.com/p/AF1QipPWmad0d8tQUQMDp6HmbPBwSkRlI1jIq5w0z_n5=s1360-w1360-h1020",
        "description": "At Paul's Pel'meni, we serve the best dumplings in Madison! Enjoy our variety of fillings, including beef, potato, and more. Conveniently located near the University of Wisconsin-Madison and the Kohl Center.",
        "rating": "4.4",
        "location": "414 W Gilman St, Madison, WI 53703",
        "happy_hour_deals": [
          {
            "day": "Tuesday-Sunday",
            "details": "5:00-8:00PM: $4 Taps, $4 Rail Drinks, $4 Tall Boy (Miller Lite), $3 Skrewball Shot, $5 Double Dirty Shirley Temple, 5 orders of Frozen Dumplings to go for $30.",
            "start_time": "17:00",
            "end_time": "20:00",
            "deal_list": ["Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
          }
        ],
        "latitude": "43.0745402",
        "longitude": "-89.3941015",
        "category": ["Drinks", "Appetizers"],
        "dotw": ["Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        "cuisine": "Russian"
      },
      {
        "id": "29",
        "name": "The Botanist Social",
        "image": "https://lh3.googleusercontent.com/18NcA0pGgWcJZzScfo6OAzQv1F90KJZ81kFOGxzcwSZd4HpYsFfTEoR-VtjXb-9ASq0jlr5zHhj4Dd3nsZiNaFiMsCWPByRd9sdZict_",
        "description": "The Botanist Social is a chic cocktail lounge known for its botanical-inspired drinks and intimate atmosphere. It's a great place to unwind with friends over drinks.",
        "rating": "4.5",
        "location": "206 State St, Madison, WI 53703",
        "happy_hour_deals": [
          {
            "day": "Monday-Friday",
            "details": "Half Price on bottles (Rosé).",
            "start_time": "16:00",
            "end_time": "23:59",
            "deal_list": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
          }
        ],
        "latitude": "43.0749886",
        "longitude": "-89.3883849",
        "category": ["Drinks"],
        "dotw": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        "cuisine": "Cocktail"
      },
      {
        "id": "30",
        "name": "Cask & Ale",
        "image": "https://lh3.googleusercontent.com/p/AF1QipO2qTo0GWG8aCopGHgRYo28DOjsrum8-Fz6-HkV=s1360-w1360-h1020",
        "description": "Cask & Ale is a popular bar in downtown Madison, known for its craft cocktails, extensive whiskey selection, and lively atmosphere.",
        "rating": "4.4",
        "location": "212 State St, Madison, WI 53703",
        "happy_hour_deals": [
          {
            "day": "Monday-Friday",
            "details": "4:00-6:00PM: $1 OFF all taps. Includes 26 draught beers, 4 wines on tap, 6 cocktails on tap, and 2 barrel-aged Old Fashioneds.",
            "start_time": "16:00",
            "end_time": "18:00",
            "deal_list": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
          }
        ],
        "latitude": "43.0748957",
        "longitude": "-89.3885628",
        "category": ["Drinks"],
        "dotw": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        "cuisine": "Cocktail"
      },      
      {
        "id": "31",
        "name": "Hawk’s Bar & Grill",
        "image": "https://www.travelwisconsin.com/uploads/places/17/1735765d-46db-4e17-bceb-a9dee910a327-img_8274.jpg?width=680&height=340&crop=auto&scale=both&quality=80",
        "description": "Hawk's Bar & Grill is a classic bar in downtown Madison, known for its comfortable atmosphere, strong drinks, and great deals on both drinks and food.",
        "rating": "4.0",
        "location": "425 State St, Madison, WI 53703",
        "happy_hour_deals": [
          {
            "day": "Everyday",
            "details": "$7 Door County Brewing Witbier, $6 for 2 White Claws, $5 Single Rail Mixers, $7 House-Infused Tito’s Mixers, $5 Spaten Oktoberfest bottles, $4 Montucky Cold Snacks, $4 Cherry Bombs, $2 Apple Pie Shots.",
            "start_time": "11:00",
            "end_time": "23:59",
            "deal_list": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
          }
        ],
        "latitude": "43.074678",
        "longitude": "-89.3927444",
        "category": ["Drinks"],
        "dotw": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        "cuisine": "American"
      },
      {
        "id": "32",
        "name": "Chasers 2.0",
        "image": "https://static.wixstatic.com/media/cf748f_8761c63ba0e9485f951955745fe4bded~mv2.jpg/v1/fill/w_640,h_402,al_c,q_80,usm_0.66_1.00_0.01,enc_auto/cf748f_8761c63ba0e9485f951955745fe4bded~mv2.jpg",
        "description": "Chasers is a lively sports bar on Madison's east side offering great drink specials and a vibrant atmosphere, perfect for college students and locals alike.",
        "rating": "4.1",
        "location": "319 W Gorham St, Madison, WI 53703",
        "happy_hour_deals": [
          {
            "day": "Tuesday",
            "details": "5:00-10:00PM: $7 Mini Pitchers, $12 64oz Domestic Pitchers, $2 Craft, $5 Double Rails, $5 High Noons. 10:00PM-Close: $3 for anything except pitchers.",
            "start_time": "17:00",
            "end_time": "23:59",
            "deal_list": ["Tuesday"]
          },
          {
            "day": "Thursday",
            "details": "5:00-9:00PM: 2-4-1 Pizzas, $3 Taps. 7:00-10:00PM: $2 Rails, $2 Busch Tall Boys. 10:00PM-Close: 2-4-1 Rails, Shots/Bombs, Tall Boys, and High Noon.",
            "start_time": "17:00",
            "end_time": "23:59",
            "deal_list": ["Thursday"]
          },
          {
            "day": "Friday",
            "details": "4:00-5:00PM: $1 Rails and Berry Water Limes. 5:00-6:00PM: $2 Rails and Berry Water Limes. 6:00-7:00PM: $3 Rails and Berry Water Limes. 4:00-7:00PM: $3 Shorties. 7:00PM-Close: $4 Double Berry Water Limes, $5 Double Rails, High Noons, and Tall Boys.",
            "start_time": "16:00",
            "end_time": "23:59",
            "deal_list": ["Friday"]
          }
        ],
        "latitude": "43.0745608",
        "longitude": "-89.3918914",
        "category": ["Drinks", "Meals"],
        "dotw": ["Tuesday", "Thursday", "Friday"],
        "cuisine": "American"
      },
      {
        "id": "33",
        "name": "The Double U",
        "image": "https://static.wixstatic.com/media/cf748f_b80fe64161a547a2906cbd1cbfc88438~mv2.jpeg/v1/fill/w_640,h_402,al_c,q_80,usm_0.66_1.00_0.01,enc_auto/cf748f_b80fe64161a547a2906cbd1cbfc88438~mv2.jpeg",
        "description": "The Double U is a large, vibrant sports bar located near campus, offering great drink deals, large screens for watching sports, and a spacious outdoor patio.",
        "rating": "4.0",
        "location": "620 University Ave, Madison, WI 53703",
        "happy_hour_deals": [
          {
            "day": "Thursday",
            "details": "5:00PM-Close: $7 32 oz Pitchers, $7 64 oz PBR pitchers, $12 Domestic 64 oz, $14 Craft 64 oz, $5 Doubles and Seltzers. 9:00PM-10:00PM: $1 Rails and PBR Taps. 10:00PM-11:00PM: $3 Rails and Berry Water Lime, $4 Busch Light, 2 for 1 Cherry Bombs.",
            "start_time": "17:00",
            "end_time": "23:59",
            "deal_list": ["Thursday"]
          },
          {
            "day": "Friday",
            "details": "4:00PM-7:00PM: 2 for 1 Rail Doubles and Double Berry Water Limes, 2 for 1 Pizzas, $3.50 Spotted Cow Cans. 7:00PM-Close: $4 Double Rails and Double Berry Water Limes, $4 Tallboys, $6 High Noons.",
            "start_time": "16:00",
            "end_time": "23:59",
            "deal_list": ["Friday"]
          },
          {
            "day": "Saturday",
            "details": "$5 Busch Light Tallboys, $15 Mimosa Pitchers.",
            "start_time": "8:00",
            "end_time": "23:59",
            "deal_list": ["Saturday"]
          }
        ],
        "latitude": "43.0734158",
        "longitude": "-89.3967408",
        "category": ["Drinks", "Meals"],
        "dotw": ["Thursday", "Friday", "Saturday"],
        "cuisine": "American"
      },
      {
        "id": "34",
        "name": "Paul’s Club",
        "image": "https://visitdowntownmadison.com/galleries/directory/paul-s-club-47525bd5-15e1-9f09-398a-a04850e9ea02.v/featured.jpg?nocache=8qrtvmLLwfYS",
        "description": "Paul’s Club is a cozy, vintage-style bar located on State Street, well-known for its giant tree centerpiece and laid-back atmosphere.",
        "rating": "4.5",
        "location": "212 State St, Madison, WI 53703",
        "happy_hour_deals": [
          {
            "day": "Everyday",
            "details": "$3 16oz cans Busch Light, Montucky, PBR, Old Milwaukee. $3 PBR Tap and Michelob Taps.",
            "start_time": "16:00",
            "end_time": "23:59",
            "deal_list": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
          }
        ],
        "latitude": "43.0748957",
        "longitude": "-89.3885628",
        "category": ["Drinks"],
        "dotw": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        "cuisine": "American"
      },
      {
        "id": "35",
        "name": "BelAir Cantina",
        "image": "https://static.spotapps.co/website_images/ab_websites/2280_website/locations/locations_madison.jpg",
        "description": "Inspired by authenticity and defined by innovation, BelAir Cantina is a place to come as you are and enjoy a dining experience like no other.",
        "rating": "3.2",
        "location": "111 Martin Luther King Jr Blvd, Madison, WI 53703",
        "happy_hour_deals": [
          {
            "day": "Monday",
            "details": "$5 Margaritas.",
            "start_time": "11:00",
            "end_time": "22:00",
            "deal_list": ["Monday"]
          },
          {
            "day": "Tuesday",
            "details": "$3 Tacos.",
            "start_time": "11:00",
            "end_time": "22:00",
            "deal_list": ["Tuesday"]
          },
          {
            "day": "Wednesday",
            "details": "All burritos are $11.11.",
            "start_time": "11:00",
            "end_time": "22:00",
            "deal_list": ["Wednesday"]
          },
          {
            "day": "Thursday",
            "details": "$3 Tacos.",
            "start_time": "11:00",
            "end_time": "23:00",
            "deal_list": ["Thursday"]
          }
        ],
        "latitude": "43.0738264",
        "longitude": "-89.382629",
        "category": ["Drinks", "Meals","Appetizers"],
        "dotw": ["Monday", "Tuesday", "Wednesday", "Thursday"],
        "cuisine": "Mexican"
      },      
      {
        "id": "36",
        "name": "Luchador",
        "image": "https://lh3.googleusercontent.com/p/AF1QipOXx3bHxI8FdGc2xsPR86fh-1sQ3H8FcK3rmn2A=s1360-w1360-h1020",
        "description": "",
        "rating": "3.85",
        "location": "558 State St, Madison, WI 53703",
        "happy_hour_deals": [
          {
            "day": "Monday-Friday",
            "details": "4:00-6:00PM: $3 All Tacos, $3 All Beers, $4 Draft Cocktails.",
            "start_time": "16:00",
            "end_time": "18:00",
            "deal_list": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
          },
          {
            "day": "Monday",
            "details": "6:00PM-Close: Half OFF Frozen & House Margaritas, $4 Patron & Casamigos Shots.",
            "start_time": "18:00",
            "end_time": "22:00",
            "deal_list": ["Monday"]
          },
          {
            "day": "Tuesday",
            "details": "6:00PM-Close: $18 All you can eat tacos, $3 Corona & Modelo, $3 Altos Shots.",
            "start_time": "18:00",
            "end_time": "23:30",
            "deal_list": ["Tuesday"]
          },
          {
            "day": "Wednesday",
            "details": "6:00PM-Close: $4 Patron Shots, $8 Patron Margaritas.",
            "start_time": "18:00",
            "end_time": "23:30",
            "deal_list": ["Wednesday"]
          },
          {
            "day": "Thursday",
            "details": "6:00PM-Close: $6 Draft Cocktails. 9:00PM-Close: $3 Traditional Tacos, $5 Double Rail, $6 House Margarita.",
            "start_time": "18:00",
            "end_time": "23:30",
            "deal_list": ["Thursday"]
          },
          {
            "day": "Friday-Saturday",
            "details": "9:00PM-Close: $3 Traditional Tacos, $10 Rail Mini Pitchers, $10 Tap Mini Pitchers, $12 House Margarita Mini Pitchers.",
            "start_time": "21:00",
            "end_time": "23:30",
            "deal_list": ["Friday", "Saturday"]
          }
        ],
        "latitude": "43.0749799",
        "longitude": "-89.3949378",
        "category": ["Drinks", "Meals", "Appetizers"],
        "dotw": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        "cuisine": "Mexican"
      },
      {
        "id": "37",
        "name": "Wando’s",
        "image": "https://lh3.googleusercontent.com/p/AF1QipPX2QDk32-0VPld9CV_Ro0Gsxibra8yzZf1I9Kx=s1360-w1360-h1020",
        "description": "Wando's is a lively college bar in downtown Madison, famous for its fishbowls, free bacon nights, and strong drinks. It’s a favorite hangout for students and locals alike.",
        "rating": "4.0",
        "location": "602 University Ave, Madison, WI 53715",
        "happy_hour_deals": [
          {
            "day": "Tuesday",
            "details": "Bacon Night: Free Bacon, $3 Nutrl.",
            "start_time": "20:00",
            "end_time": "23:59",
            "deal_list": ["Tuesday"]
          },
          {
            "day": "Thursday",
            "details": "8:00PM-Close: $12 Fishbowls, $6 Deep Eddy Doubles, $4 Nutrls.",
            "start_time": "20:00",
            "end_time": "23:59",
            "deal_list": ["Thursday"]
          },
          {
            "day": "Friday",
            "details": "8:00PM-Close: $20 O.G. 100 oz Fishbowls.",
            "start_time": "20:00",
            "end_time": "23:59",
            "deal_list": ["Friday"]
          },
          {
            "day": "Saturday",
            "details": "10:30-3:00PM: $12 Megamosas, $5 Breakfast Sandwiches.",
            "start_time": "10:30",
            "end_time": "23:59:00",
            "deal_list": ["Saturday"]
          }
        ],
        "latitude": "43.0734386",
        "longitude": "-89.3959883",
        "category": ["Drinks"],
        "dotw": ["Tuesday", "Thursday", "Friday", "Saturday"],
        "cuisine": "American"
      },
      {
        "id": "38",
        "name": "Jay’s",
        "image": "https://jaysbarmadison.com/photos/jays-outside.jpg",
        "description": "Jay’s is a modern cocktail bar located near the Capitol, offering creative drinks and a vibrant atmosphere. It’s a popular spot for weekend outings and casual nights with friends.",
        "rating": "4.3",
        "location": "406 N Frances St, Madison, WI 53703",
        "happy_hour_deals": [
          {
            "day": "Thursday",
            "details": "Thirsty Thursday: $8 Badger Long Islands, $6 Espresso Martinis.",
            "start_time": "20:00",
            "end_time": "23:59",
            "deal_list": ["Thursday"]
          },
          {
            "day": "Friday",
            "details": "TGIF.",
            "start_time": "16:00",
            "end_time": "23:59",
            "deal_list": ["Friday"]
          },
          {
            "day": "Saturday",
            "details": "Jumbos @Jay’s: $8 JUMBO Long Islands.",
            "start_time": "16:00",
            "end_time": "23:59",
            "deal_list": ["Saturday"]
          }
        ],
        "latitude": "43.0735635",
        "longitude": "-89.3959635",
        "category": ["Drinks"],
        "dotw": ["Thursday", "Friday", "Saturday"],
        "cuisine": "American"
      },
      {
        "id": "39",
        "name": "Nitty Gritty",
        "image": "https://www.thegritty.com/sites/default/files/styles/flexslider_home/public/uploads/slides/49/dtng.jpg?itok=L0Udy7j8",
        "description": "The Nitty Gritty is a classic American bar and grill famous for its birthday tradition and great happy hour specials. It’s a local institution, offering casual dining and a fun atmosphere.",
        "rating": "4.1",
        "location": "223 N Frances St, Madison, WI 53703",
        "happy_hour_deals": [
          {
            "day": "Monday",
            "details": "9:00PM-Close: $1 Tacos, $3 Modelo, Corona, Topo Chico, and Pacifico. $3 Milagro Shots & Margaritas.",
            "start_time": "21:00",
            "end_time": "23:59",
            "deal_list": ["Monday"]
          },
          {
            "day": "Tuesday",
            "details": "9:00PM-Close: $2 Captain Mixers, $2 Coors Light Pints, $2 Lemon Drop Shots.",
            "start_time": "21:00",
            "end_time": "23:59",
            "deal_list": ["Tuesday"]
          },
          {
            "day": "Wednesday",
            "details": "9:00PM-Close: $2 Wisconsin Pints, $3 Cherry Bombs, $2 Tito’s Mixers.",
            "start_time": "21:00",
            "end_time": "23:59",
            "deal_list": ["Wednesday"]
          },
          {
            "day": "Thursday",
            "details": "9:00PM-Close: $2 White Claws, Spotted Cow Pints, SKYY Vodka Mixers, and Classic Shots.",
            "start_time": "21:00",
            "end_time": "23:59",
            "deal_list": ["Thursday"]
          },
          {
            "day": "Friday",
            "details": "9:00PM-Close: $2 Tullamore Dew Shots, $4.50 Tito’s Mixers, $4.75 High Noon Cans.",
            "start_time": "21:00",
            "end_time": "23:59",
            "deal_list": ["Friday"]
          },
          {
            "day": "Saturday",
            "details": "9:00PM-Close: $3 Fireball Shots, $4 Angry Orchard Pints, $4.50 Tito’s Mixers.",
            "start_time": "21:00",
            "end_time": "23:59",
            "deal_list": ["Saturday"]
          },
          {
            "day": "Sunday",
            "details": "All day: $7 High Life Pitchers, $5 Double Tito’s Mixers, $4.75 High Noon Cans. 11:00PM-Close: $3 White Claws, Fireball Shots, Rail Mixers, and PBR Tall Boys.",
            "start_time": "11:00",
            "end_time": "23:59",
            "deal_list": ["Sunday"]
          },
          {
            "day": "Everyday",
            "details": "Power Hour (10:00-11:00PM): $1 High Life Pints, $1.75 Rail Mixers, $2.75 Bomb Shots. Happy Hour (3:00-5:00PM): $2 OFF Tap Beers, Appetizers, Wine, Single Mixers.",
            "start_time": "22:00",
            "end_time": "23:00",
            "deal_list": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
          },
          {
            "day": "Everyday",
            "details": "3:00-5:00PM: $2 OFF Tap Beers, Appetizers, Wine, Single Mixers.",
            "start_time": "15:00",
            "end_time": "17:00",
            "deal_list": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
          }
        ],
        "latitude": "43.0718301",
        "longitude": "-89.3955975",
        "category": ["Drinks", "Appetizers"],
        "dotw": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        "cuisine": "American"
      },      
      {
        "id": "40",
        "name": "Vintage Spirits & Grill",
        "image": "https://badgerherald.com/wp-content/uploads/2023/11/IMG_4324-1344x1008.jpg",
        "description": "Bar & grill with a retro vibe with a big craft beer list including house brews & an outdoor patio.",
        "rating": "4.4",
        "location": "529 University Ave, Madison, WI 53703",
        "happy_hour_deals": [
          {
            "day": "Monday-Friday",
            "details": "3:00-5:30PM: $2 rail mixers and $3 VBC Taps <7% ABV.",
            "start_time": "15:00",
            "end_time": "17:30",
            "deal_list": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
          },
          {
            "day": "Monday",
            "details": "$6 RIP-RIP Chicken & Fries.",
            "start_time": "15:00",
            "end_time": "23:59",
            "deal_list": ["Monday"]
          },
          {
            "day": "Tuesday",
            "details": "$8 Grilled Cheese.",
            "start_time": "15:00",
            "end_time": "23:59",
            "deal_list": ["Tuesday"]
          },
          {
            "day": "Wednesday",
            "details": "$7 Mac & Cheese.",
            "start_time": "15:00",
            "end_time": "23:59",
            "deal_list": ["Wednesday"]
          },
          {
            "day": "Thursday",
            "details": "$3 Tacos (Chicken, Beef, & Fish).",
            "start_time": "15:00",
            "end_time": "23:59",
            "deal_list": ["Thursday"]
          }
        ],
        "latitude": "43.0729792",
        "longitude": "-89.3955019",
        "category": ["Drinks", "Appetizers"],
        "dotw": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        "cuisine": "American"
      },{
        "id": "41",
        "name": "State Street Brats",
        "image": "https://lh3.googleusercontent.com/p/AF1QipPtLP0Tx1qRTb5DsutPACKIB8niSeRqMxI92_ye=s1360-w1360-h1020",
        "description": "A popular sports bar on State Street, known for its iconic red bratwurst, extensive drink specials, and large outdoor patio, making it a favorite hangout for students and sports fans.",
        "rating": "4.0",
        "location": "603 State St, Madison, WI 53703",
        "happy_hour_deals": [
          {
            "day": "Monday",
            "details": "11:00AM-4:00PM: $10 Red Brat. 3:00-5:00PM: Half OFF Apps. 10:00-11:00PM: $1 Shots, $2 Bombs. Mug Monday 4:00-: $8 Rail and Beer Steins.",
            "start_time": "11:00",
            "end_time": "23:59",
            "deal_list": ["Monday"]
          },
          {
            "day": "Tuesday",
            "details": "11:00AM-4:00PM: $10 Tenders. 3:00-5:00PM: ½ OFF Apps. 10:00-11:00PM: $1 Shots, $2 Bombs. BOGO (8:00PM): Pints, Mixers, Cans, Shots & Bombs.",
            "start_time": "11:00",
            "end_time": "23:59",
            "deal_list": ["Tuesday"]
          },
          {
            "day": "Wednesday",
            "details": "11:00AM-4:00PM: $10 White Brats. 3:00-5:00PM: ½ OFF Apps. 10:00-11:00PM: $1 Shots, $2 Bombs. TRIVIA (7:00PM): ½ OFF Apps, $10 Pitchers, $1 Dr. McGillicuddy’s Shots, & $2 Bombs.",
            "start_time": "11:00",
            "end_time": "23:59",
            "deal_list": ["Wednesday"]
          },
          {
            "day": "Thursday",
            "details": "11:00AM-4:00PM: $10 Cheeseburger. 3:00-5:00PM: ½ OFF Apps. 10:00-11:00PM: $1 Shots, $2 Bombs. 6:00-9:00PM: $1 Chicken Tenders & $8 Coors Light Pitchers. 9:00PM BOTTOMLESS: $10 Rails, Berry Water Limes, Long Islands, Pink Whitney, Miller Life, Coors Light, High Life, BlueMoon & Summer Shandy.",
            "start_time": "11:00",
            "end_time": "23:59",
            "deal_list": ["Thursday"]
          },
          {
            "day": "Friday",
            "details": "11:00AM-8:00PM: $12 Fish Fry. 10:00-11:00PM: $1 Shots & $2 Bombs. All Day: $4 Bombs, $5 Blue Moon & Leinie’s Pints, $7 DBL Tito’s, $8 Brandy Old Fashioned, $5 DBL Berry Water Lime.",
            "start_time": "11:00",
            "end_time": "20:00",
            "deal_list": ["Friday"]
          },
          {
            "day": "Saturday",
            "details": "STEIN SATURDAY (ALL DAY): $14 Craft Beer Steins, $10 Miller & Coors Steins, $14 BeerMosa/CiderMosa, $10 Rail & Long Island Steins, & $15 HausMosa. Specials (All Day): $4 Green Tea, $5 Bombs, $8 Pacifico, Twea, & PBR 24oz Silos, $12 High Life Pitchers.",
            "start_time": "11:00",
            "end_time": "23:59",
            "deal_list": ["Saturday"]
          },
          {
            "day": "Sunday",
            "details": "10:00AM-2:00PM: $15 Bottomless Mimosas. All Day: BOGO Wings. (7:00PM) Industry Night: $5 DBL Vodka Red Bulls, $3 Cherry Bombs, $3 Rumple, $3 Coors.",
            "start_time": "10:00",
            "end_time": "23:59",
            "deal_list": ["Sunday"]
          }
        ],
        "latitude": "43.0746741",
        "longitude": "-89.395981",
        "category": ["Drinks", "Meals","Appetizers"],
        "dotw": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        "cuisine": "American"
      },
      {
        "id": "42",
        "name": "Canteen",
        "image": "https://resizer.otstatic.com/v2/photos/xlarge/1/25887838.jpg",
        "description": "A lively taco joint and tequila bar nestled in a vibrant corner of downtown Madison.",
        "rating": "3.9",
        "location": "111 S Hamilton St, Madison, WI 53703",
        "happy_hour_deals": [
          {
            "day": "Everyday",
            "details": "2:00-5:00PM: Half OFF Tacos, $3 Tecate Cans, $6 Tecate Can & Bartender's Choice (Tequila or Mezcal), Half off Pacifico, Dos Equis Lager, and Dos Equis Amber Pints, Half off Wine, Half off Signature Margaritas.",
            "start_time": "14:00",
            "end_time": "17:00",
            "deal_list": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
          },
          {
            "day": "Everyday",
            "details": "9:00PM-Close: Half OFF Tacos, $3 Tecate Cans, $6 Tecate Can & Bartender's Choice (Tequila or Mezcal), Half off Pacifico, Dos Equis Lager, and Dos Equis Amber Pints, Half off Wine, Half off Signature Margaritas.",
            "start_time": "21:00",
            "end_time": "22:00",
            "deal_list": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
          }
        ],
        "latitude": "43.0727851",
        "longitude": "-89.3840873",
        "category": ["Drinks", "Appetizers"],
        "dotw": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        "cuisine": "Mexican"
      },
      {
        "id": "43",
        "name": "City Bar",
        "image": "https://pbs.twimg.com/profile_images/1275242046224244736/oyb-yJZ0_400x400.jpg",
        "description": "A classic downtown bar offering a wide variety of drink specials and a fun, laid-back atmosphere. It’s a great spot for happy hour or watching the game.",
        "rating": "4.1",
        "location": "636 State St, Madison, WI 53703",
        "happy_hour_deals": [
          {
            "day": "Monday",
            "details": "$4/$12 Tap Beer Feature, $5 Tito’s Mules, $4 Cucumber Infused Vodka.",
            "start_time": "15:00",
            "end_time": "23:59",
            "deal_list": ["Monday"]
          },
          {
            "day": "Tuesday",
            "details": "$4 Berry Water Lime, $5 Crop Organic Lemon Drops, $10 Rail & LIT 32oz Pitchers.",
            "start_time": "15:00",
            "end_time": "23:59",
            "deal_list": ["Tuesday"]
          },
          {
            "day": "Wednesday",
            "details": "$4/$16 Wine, $4 LIT.",
            "start_time": "15:00",
            "end_time": "23:59",
            "deal_list": ["Wednesday"]
          },
          {
            "day": "Thursday",
            "details": "$4 Berry Water Lime, $5 Crop Organic Lemon Drops, $5 Strawberry Infused Vodka.",
            "start_time": "15:00",
            "end_time": "23:59",
            "deal_list": ["Thursday"]
          },
          {
            "day": "Friday",
            "details": "$5 Strawberry Infused Vodka, $4 New Amsterdam Cocktails.",
            "start_time": "15:00",
            "end_time": "23:59",
            "deal_list": ["Friday"]
          },
          {
            "day": "Saturday",
            "details": "$4 Berry Water Lime, $5 Tito’s Mules.",
            "start_time": "15:00",
            "end_time": "23:59",
            "deal_list": ["Saturday"]
          }
        ],
        "latitude": "43.0749852",
        "longitude": "-89.3961113",
        "category": ["Drinks"],
        "dotw": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        "cuisine": "Bar"
      },
      {
        "id": "44",
        "name": "Tutto with a Touch of Sass",
        "image": "https://static.spotapps.co/website_images/ab_websites/123607_website_v1/video_cover_photo.jpg",
        "description": "An eclectic Italian-American restaurant offering hearty dishes with a touch of flair, known for its all-you-can-eat specials and extensive drink menu.",
        "rating": "4.2",
        "location": "10 W Mifflin St Ste 110, Madison, WI 53703",
        "happy_hour_deals": [
            {
                "day": "Everyday",
                "details": "Drink Specials: $11 “The Camerita” Cocktail, $12 “French 75”,  $12 “Irish Lemonade”, By The Glass Wine:$10 Placido Moscato d’Asti, $10 Natura Merlot, $13 Banfi Pinot Grigio, $13 Rainstorm Pinot Grigio ",
                "start_time": "11:00",
                "end_time": "22:00",
                "deal_list": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
              },
          {
            "day": "Monday",
            "details": "$30 All you can eat Ribs. (Starts with 8 bones and 2 sides. Reorders are up to 4 Bones and must have a side. 1 sauce/order. No plate sharing.)",
            "start_time": "11:00",
            "end_time": "22:00",
            "deal_list": ["Monday"]
          },
          {
            "day": "Wednesday",
            "details": "11:00AM-3:00PM: $10 Burger and a Beverage (Your choice of Draft Beer or Non-alcoholic Beverage). Comes with an 8oz Steak Burger, lettuce, tomato, 1 side. Toppings are extra.",
            "start_time": "11:00",
            "end_time": "15:00",
            "deal_list": ["Wednesday"]
          },
          {
            "day": "Thursday",
            "details": "$30 All you can Peel and Eat Shrimp. Comes with Corn, Potatoes and Butter to start. Half pound reorders. No plate sharing.",
            "start_time": "11:00",
            "end_time": "22:00",
            "deal_list": ["Thursday"]
          },
          {
            "day": "Sunday",
            "details": "$2 Rib Bones/$2 Wings, $15 Bottomless Mimosas or Tito’s Handmade Vodka Bloody Mary’s.",
            "start_time": "11:00",
            "end_time": "22:00",
            "deal_list": ["Sunday"]
          },
        ],
        "latitude": "43.0755046",
        "longitude": "-89.3858639",
        "category": ["Drinks", "Meals","Appetizers"],
        "dotw": ["Monday", "Wednesday", "Thursday", "Sunday"],
        "cuisine": "Italian-American"
      },
      {
        "id": "45",
        "name": "Jalisco",
        "image": "https://lh3.googleusercontent.com/p/AF1QipMhs7pSxI-aI_av30SzyTKS68ErnyuKPUKoFIlM=s1360-w1360-h1020",
        "description": "Jalisco is a casual Mexican eatery offering classic dishes, including tacos and margaritas, with a laid-back atmosphere.",
        "rating": "4.0",
        "location": "108 King St, Madison, WI 53703",
        "happy_hour_deals": [
          {
            "day": "Monday-Saturday",
            "details": "2:00-5:00PM: $12 for 2 Margs, $6 for 1 Margs, $7 Paloma, $3 Corona or Miller High Life, $11 nachos, $9 Taquitos, $6 chips and guac",
            "start_time": "14:00",
            "end_time": "17:00",
            "deal_list": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
          },
          {
            "day": "Monday",
            "details": "11:30AM-9:00PM: $5 Traditional Lime Margaritas all day.",
            "start_time": "11:30",
            "end_time": "21:00",
            "deal_list": ["Monday"]
          },
          {
            "day": "Tuesday",
            "details": "11:30AM-9:00PM: $3 A La Carte Classic Tacos all day.",
            "start_time": "11:30",
            "end_time": "21:00",
            "deal_list": ["Tuesday"]
          },
          {
            "day": "Friday",
            "details": "11:30AM-9:00PM: Fish Fry Friday! Two Jumbo Fried Shrimp Tacos for $10.",
            "start_time": "11:30",
            "end_time": "21:00",
            "deal_list": ["Friday"]
          }
        ],
        "latitude": "43.0747681",
        "longitude": "-89.3812303",
        "category": ["Drinks", "Meals","Appetizers"],
        "dotw": ["Monday", "Tuesday", "Friday"],
        "cuisine": "Mexican"
      },      
      {
        "id": "46",
        "name": "Whiskey Jacks",
        "image": "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/12/52/59/bb/20180310-194847-largejpg.jpg?w=1200&h=1200&s=1",
        "description": "A popular bar known for its lively nightlife, live music, and themed events, Whiskey Jacks offers a variety of drink specials throughout the week.",
        "rating": "3.9",
        "location": "552 State St, Madison, WI 53703",
        "happy_hour_deals": [
          {
            "day": "Monday",
            "details": "7:00PM-Close: $3 Pink Whitney and Hornitos Shots, $3 Smirnoff Mixers, $4 Corona and Modelo.",
            "start_time": "19:00",
            "end_time": "23:59",
            "deal_list": ["Monday"]
          },
          {
            "day": "Tuesday",
            "details": "7:00PM-Close: Karaoke: $2 Miller and Coors Bottles, $3 Carbless, $6 Double Rail Mixers, 2-4-1 Bomb Shots.",
            "start_time": "19:00",
            "end_time": "23:59",
            "deal_list": ["Tuesday"]
          },
          {
            "day": "Wednesday",
            "details": "Bingo (7:00PM-2:00AM): $3 High Noons, $8 Mini Pitchers of Rail Mixers & Domestic Taps, 2-4-1 Board Shots.",
            "start_time": "19:00",
            "end_time": "23:59",
            "deal_list": ["Wednesday"]
          },
          {
            "day": "Thursday",
            "details": "7:00PM-8:00PM: 25 cent Rails, Coors, & Twisted Teas. 8:00PM-9:00PM: 50 cent Rails, Coors, & Twisted Teas. 9:00PM-10:00PM: $1 Rails, Coors, & Twisted Teas. 10:00PM-Close: $3 Everything (excluding pitchers, shots, and top shelf).",
            "start_time": "19:00",
            "end_time": "23:59",
            "deal_list": ["Thursday"]
          },
          {
            "day": "Friday",
            "details": "Live Music: 8:00PM-9:00PM: $2 YOU-CALL-ITS. 9:00PM-10:00PM: $3 YOU-CALL-ITS. 10:00PM-Close: $3 Fireball Shots, $4 Busch Lite Tall Boys & Truly, $8 Absolut Doubles.",
            "start_time": "20:00",
            "end_time": "23:59",
            "deal_list": ["Friday"]
          },
          {
            "day": "Saturday",
            "details": "Live Music: 8:00PM-9:00PM: $2 YOU-CALL-ITS. 9:00PM-10:00PM: $3 YOU-CALL-ITS. 10:00PM-Close: $3 Apple Pie Shots, $4 Busch Lite Tall Boys & Truly, $7 Captain and Malibu Doubles.",
            "start_time": "20:00",
            "end_time": "23:59",
            "deal_list": ["Saturday"]
          },
          {
            "day": "Sunday",
            "details": "$3 Casamigos, Milagro, Jameson Shots. $5 Tito’s and Crown Mixers. $8 Pitcher of Any Beer.",
            "start_time": "06:00",
            "end_time": "23:59",
            "deal_list": ["Sunday"]
          }
        ],
        "latitude": "43.0749699",
        "longitude": "--89.3948319",
        "category": ["Drinks"],
        "dotw": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        "cuisine": "Bar"
      },
      {
        "id": "47",
        "name": "The Rigby",
        "image": "https://assets.simpleviewinc.com/simpleview/image/upload/crm/madison/front10-7f8d998c5056a36_7f8d9abb-5056-a36a-086a98fec7bd49b3.jpg",
        "description": "The Rigby is a Beatles-themed bar with live music, affordable drinks, and a relaxed, fun vibe. It's a favorite spot for weekend entertainment and classic American food.",
        "rating": "3.7",
        "location": "119 E Main St, Madison, WI 53703",
        "happy_hour_deals": [
          {
            "day": "Monday",
            "details": "$2 Tacos.",
            "start_time": "15:00",
            "end_time": "23:59",
            "deal_list": ["Monday"]
          },
          {
            "day": "Monday",
            "details": "10:00PM-Close: $4 dollar El Jimador shots, $7 dollar El Jimador Margs, $6 dollar margs, $5 dollar corona/modelo, $3 dollar tacos, $5 dollar “walking” tacos.",
            "start_time": "22:00",
            "end_time": "23:59",
            "deal_list": ["Monday"]
          },
          {
            "day": "Tuesday",
            "details": "$3 Tots.",
            "start_time": "15:00",
            "end_time": "23:59",
            "deal_list": ["Tuesday"]
          },
          {
            "day": "Wednesday",
            "details": "$3 Fries.",
            "start_time": "15:00",
            "end_time": "23:59",
            "deal_list": ["Wednesday"]
          },
          {
            "day": "Friday",
            "details": "Fish Fry specials.",
            "start_time": "15:00",
            "end_time": "23:59",
            "deal_list": ["Friday"]
          },
          {
            "day": "Saturday",
            "details": "10:00AM-6:00PM: $4 Brats $6 Bloody Marys, $7 Pickle Jalapeno Bloody Marys, $2 Jello Shots, $5 Seltzers, $15 Bottomless Mimosas (2-hour max).",
            "start_time": "10:00",
            "end_time": "18:00",
            "deal_list": ["Saturday", "Sunday"]
          }
          ,
          {
            "day": "Sunday",
            "details": " 11:00AM-6:00PM: $6 Bloody Marys, $7 Pickle Jalapeno Bloody Marys, $2 Jello Shots, $5 Seltzers, $15 Bottomless Mimosas (2-hour max).",
            "start_time": "11:00",
            "end_time": "18:00",
            "deal_list": ["Saturday", "Sunday"]
          }
        ],
        "latitude": "43.0749857",
        "longitude": "-89.3810853",
        "category": ["Drinks", "Meals","Appetizers"],
        "dotw": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        "cuisine": "American"
      },
      {
        "id": "48",
        "name": "Tempest Oyster Bar",
        "image": "https://s3-media0.fl.yelpcdn.com/bphoto/7FTbDCH7QvEPpKN3m-hAKA/o.jpg",
        "description": "Tempest Oyster Bar is a seafood restaurant offering fresh oysters and a variety of coastal-inspired dishes. It’s a popular spot for seafood lovers and offers great happy hour specials.",
        "rating": "4.0",
        "location": "120 E Wilson St Suite 3, Madison, WI 53703",
        "happy_hour_deals": [
          {
            "day": "Monday-Friday",
            "details": "4:00-6:00PM: $2 Oysters, $10 All Cocktails, $7 All Glasses of Wine, $1 Tap Beers.",
            "start_time": "16:00",
            "end_time": "18:00",
            "deal_list": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
          }
        ],
        "latitude": "43.0740703",
        "longitude": "-89.3796404",
        "category": ["Drinks", "Appetizers"],
        "dotw": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        "cuisine": "Seafood"
      },
      {
        "id": "49",
        "name": "Rare Steakhouse",
        "image": "https://assets.simpleviewinc.com/simpleview/image/upload/c_limit,q_75,w_1200/v1/crm/madison/RARE_Library00-f0efadd85056a36_f0efaf2d-5056-a36a-08e87be1e5684fed.jpg",
        "description": "Rare Steakhouse is an upscale steakhouse known for its high-quality steaks and extensive wine list. It’s a fine dining destination for special occasions and a standout spot for steak lovers.",
        "rating": "3.8",
        "location": "14 W Mifflin St, Madison, WI 53703",
        "happy_hour_deals": [
          {
            "day": "Tuesday-Friday",
            "details": "4:00-6:00PM: Half OFF Bar Menu and Drink Specials.",
            "start_time": "16:00",
            "end_time": "18:00",
            "deal_list": ["Tuesday", "Wednesday", "Thursday", "Friday"]
          }
        ],
        "latitude": "43.0753103",
        "longitude": "-89.386124",
        "category": ["Drinks", "Appetizers"],
        "dotw": ["Tuesday", "Wednesday", "Thursday", "Friday"],
        "cuisine": "Steakhouse"
      },
      {
        "id": "50",
        "name": "Tornado Room Steakhouse",
        "image": "https://cdn.vox-cdn.com/uploads/chorus_asset/file/3320884/Tornado_steak_house-5308.0.jpg",
        "description": "Tornado Steakhouse is a Madison institution, known for its late-night menu, classic steakhouse offerings, and retro atmosphere. It’s a go-to spot for steak lovers and those looking for a quality meal late at night.",
        "rating": "4.1",
        "location": "116 S Hamilton St, Madison, WI 53703",
        "happy_hour_deals": [
          {
            "day": "Wednesday & Thursday",
            "details": "Late Night Menu 10:00PM-Midnight: $21 8oz Sirloin Steak, $46 16oz New York Strip, $16 Bacon Bleu Cheese Burger, $16 Smoked Muenster Burger, $16 Steak Sandwich, $17 Salmon Sandwich, $19 Shrimp Cocktail, $9 French Onion Soup, $9 Iceberg Salad, $9 Field Greens Salad, $23 Coquille Saint Jacques, $15 Escargots, $8.50 Onion Rings, $9.50 Wisconsin Cheese Curds, $6.50 Steak Fries, $5 Baked Potato, $12 New York Style Vanilla Cheesecake, $12 Chocolate Caramel Cashew Tart.",
            "start_time": "22:00",
            "end_time": "23:59",
            "deal_list": ["Wednesday", "Thursday", "Friday", "Saturday"]
          },
          {
            "day": "Friday & Saturday",
            "details": "Late Night Menu 10:30PM-Midnight: $21 8oz Sirloin Steak, $46 16oz New York Strip, $16 Bacon Bleu Cheese Burger, $16 Smoked Muenster Burger, $16 Steak Sandwich, $17 Salmon Sandwich, $19 Shrimp Cocktail, $9 French Onion Soup, $9 Iceberg Salad, $9 Field Greens Salad, $23 Coquille Saint Jacques, $15 Escargots, $8.50 Onion Rings, $9.50 Wisconsin Cheese Curds, $6.50 Steak Fries, $5 Baked Potato, $12 New York Style Vanilla Cheesecake, $12 Chocolate Caramel Cashew Tart.",
            "start_time": "22:00",
            "end_time": "23:59",
            "deal_list": [ "Friday", "Saturday"]
          }
        ],
        "latitude": "43.0725745",
        "longitude": "-89.3846171",
        "category": ["Drinks", "Meals","Combos","Appetizers"],
        "dotw": ["Wednesday", "Thursday", "Friday", "Saturday"],
        "cuisine": "Steakhouse"
      },
      {
        "id": "51",
        "name": "Eno Vino",
        "image": "https://static.wixstatic.com/media/968194_d5f5b665e403418c8a0d8f6a1210bd61~mv2.jpg/v1/fill/w_640,h_786,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/968194_d5f5b665e403418c8a0d8f6a1210bd61~mv2.jpg",
        "description": "At Eno Vino, a high-end restaurant, we take pride in our impressive selection of over 300 wines by the bottle and 40 by the glass. Since our inception, we've been committed to offering great wine, meticulously crafted cocktails, and fresh, delectable food in an inviting atmosphere.",
        "rating": "4.1",
        "location": "1 N Webster St, Madison, WI 53703",
        "happy_hour_deals": [
          {
            "day": "Monday-Thursday",
            "details": "4:00-6:00PM: $2 OFF All Wines by the Glass, $2 OFF Hand Crafted Cocktails, $2 OFF Small Plate Bruschetta, $2 OFF Share Meals, $2 OFF Hearth Oven Flatbreads.",
            "start_time": "16:00",
            "end_time": "18:00",
            "deal_list": ["Monday", "Tuesday", "Wednesday", "Thursday"]
          },
          {
            "day": "Sunday",
            "details": "All Day: $2 OFF All Wines by the Glass, $2 OFF Hand Crafted Cocktails, $2 OFF Small Plate Bruschetta, $2 OFF Share Meals, $2 OFF Hearth Oven Flatbreads.",
            "start_time": "16:00",
            "end_time": "23:59",
            "deal_list": ["Sunday"]
          }
        ],
        "latitude": "43.0765239",
        "longitude": "-89.3822812",
        "category": ["Drinks", "Appetizers"],
        "dotw": ["Monday", "Tuesday", "Wednesday", "Thursday", "Sunday"],
        "cuisine": "Wine Bar"
      },
      {
        "id": "52",
        "name": "Sconnie Bar",
        "image": "https://bloximages.chicago2.vip.townnews.com/madison.com/content/tncms/assets/v3/editorial/d/6e/d6ec5418-a88e-5b9a-a5d3-b05ecbc8fbaf/582f5ff07cece.image.jpg?resize=804%2C500",
        "description": "Sconnie Bar is a casual and lively spot known for its affordable drinks, Wisconsin-themed atmosphere, and frequent specials, making it a favorite with students and locals alike.",
        "rating": "4.0",
        "location": "1421 Regent St, Madison, WI 53711",
        "happy_hour_deals": [
          {
            "day": "Monday-Friday",
            "details": "3:00-6:00PM: $1 OFF Rails & Taps, ½ OFF Curds, Tenders & Nachos.",
            "start_time": "15:00",
            "end_time": "18:00",
            "deal_list": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
          },
          {
            "day": "Monday-Sunday",
            "details": "Everyday Specials: $2 High Life Taps, $5 Jager Shots, $12 Sconnie Towers.",
            "start_time": "",
            "end_time": "",
            "deal_list": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
          },
          {
            "day": "Monday",
            "details": "6:00PM-Close: ½ OFF Burgers All Day, $2 Busch Light Taps, $4 Tully Shots, $4 Smirnoff Singles, $12 Bacardi Pitchers, Free Darts All Day.",
            "start_time": "18:00",
            "end_time": "Close",
            "deal_list": ["Monday"]
          },
          {
            "day": "Tuesday",
            "details": "6:00PM-Close: $4 Corona & Modelo, $5 Milagro Shots, $6 Milagro Margs (Lime & Strawberry), $11 Domestic Pitchers, $2 Tacos (6:00PM-10:00PM), Free Darts All Day.",
            "start_time": "18:00",
            "end_time": "Close",
            "deal_list": ["Tuesday"]
          },
          {
            "day": "Wednesday",
            "details": "6:00PM-Close: $4 Double Rails, $5 Select Craft Beer, $5 Screwball Shots, $7 Boneless Wing Basket (with fries) All Day, Trivia (8:00PM-10:00PM).",
            "start_time": "18:00",
            "end_time": "Close",
            "deal_list": ["Wednesday"]
          },
          {
            "day": "Thursday",
            "details": "6:00PM-Close: $3 Lemon Drops, $4 Cherry Bombs, $4 Domestic Taps, $3 Double Rails, $1 Grilled Cheese (6:00PM-10:00PM), DJ @ 9:00PM.",
            "start_time": "18:00",
            "end_time": "Close",
            "deal_list": ["Thursday"]
          },
          {
            "day": "Friday",
            "details": "6:00PM-Close: $4 Captain Singles, $4 Cherry Bombs, $5 White Claws, $5 Blue Moon Taps, $11 Domestic Pitchers.",
            "start_time": "18:00",
            "end_time": "Close",
            "deal_list": ["Friday"]
          },
          {
            "day": "Saturday",
            "details": "All Day: $5 Truly Cans, $5 Deep Eddy Singles, $6 Deep Eddy & Jager Bombs, $7 High Life Pitchers.",
            "start_time": "",
            "end_time": "",
            "deal_list": ["Saturday"]
          },
          {
            "day": "Sunday",
            "details": "All Day: $3 Domestic Taps, $4 Bacardi Singles, $6 Mega Mimosas, $6 Tito's Bloody Marys, $7 High Noon Cans, ½ OFF Wings All Day.",
            "start_time": "",
            "end_time": "",
            "deal_list": ["Sunday"]
          },
          
          {
            "day": "Sconnie Hour",
            "details": "10:30-11:30PM: $2 Single Rails, $2 Domestic Taps, $2 Mystery Shots, $3 Double Rails, $4 LITs.",
            "start_time": "22:30",
            "end_time": "23:30",
            "deal_list": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
          }
        ],
        "latitude": "43.067510",
        "longitude": "-89.413720",
        "category": ["Drinks", "Meals","Combos"],
        "dotw": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        "cuisine": "American"
      }
      
    ];      

async function authenticate() {
    try {
      // Use an admin or test email and password
      const userCredential = await signInWithEmailAndPassword(auth, "anthonyjcthomas@gmail.com", "joshuA1234$");
      console.log("Authenticated as:", userCredential.user.uid);
    } catch (error) {
      console.error("Authentication failed:", error);
    }
  }
  
  async function migrateData() {
    try {
      const batch = writeBatch(db); // Create a Firestore batch
  
      // Add all establishments to the batch
      establishments.forEach((establishment) => {
        const docRef = doc(db, "establishments", establishment.name); // Set doc ID as establishment name
        batch.set(docRef, { ...establishment, updated_at: serverTimestamp() });
      });
  
      await batch.commit(); // Commit the batch
      console.log("Batch write succeeded!");
    } catch (e) {
      console.error("Error adding document: ", e);
    }
  }
  
  // First authenticate, then migrate the data
  authenticate().then(() => {
    migrateData();
  });