import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// ============================================================================
// CONSTANTS AND DATA SETS
// ============================================================================

const DEMO_EMAIL = 'demo@logactually.com';

// Recipe URLs with optional ingredient modifications
const RECIPE_URLS = [
  { url: 'https://www.bonappetit.com/recipe/cacio-e-pepe', name: 'Cacio e Pepe', optionalIngredients: ['pecorino', 'extra pepper'] },
  { url: 'https://www.seriouseats.com/the-best-slow-cooked-bolognese-sauce-recipe', name: 'Bolognese', optionalIngredients: ['wine', 'milk'] },
  { url: 'https://cooking.nytimes.com/recipes/1015819-chocolate-chip-cookies', name: 'Chocolate Chip Cookies', optionalIngredients: ['nuts', 'chocolate chips'] },
  { url: 'https://www.allrecipes.com/recipe/23600/worlds-best-lasagna/', name: 'Lasagna', optionalIngredients: ['ricotta', 'italian sausage'] },
  { url: 'https://minimalistbaker.com/easy-pad-thai/', name: 'Pad Thai', optionalIngredients: ['peanuts', 'tofu'] },
  { url: 'https://www.budgetbytes.com/one-pot-chicken-and-rice/', name: 'Chicken and Rice', optionalIngredients: ['peas', 'carrots'] },
  { url: 'https://www.simplyrecipes.com/recipes/homemade_pizza/', name: 'Homemade Pizza', optionalIngredients: ['pepperoni', 'olives'] },
  { url: 'https://natashaskitchen.com/banana-bread-recipe-video/', name: 'Banana Bread', optionalIngredients: ['walnuts', 'chocolate chips'] },
];

// Brand names by category
const BRANDS = {
  protein: ['Quest', 'Kirkland', 'RXBAR', 'Built Bar', 'ONE Bar'],
  yogurt: ['Chobani', 'Fage', "Siggi's", 'Oikos'],
  frozen: ["Trader Joe's", "Amy's", 'Lean Cuisine', 'Healthy Choice'],
  snacks: ['KIND', 'Clif', 'Nature Valley', 'LÄRABAR'],
  drinks: ['Starbucks', "Dunkin'", 'Celsius', 'Liquid Death'],
  grocery: ['Costco', 'Whole Foods', 'Aldi', 'Wegmans'],
};

// Common typos for realistic input
const COMMON_TYPOS: Record<string, string[]> = {
  'chicken': ['chiken', 'chicekn'],
  'sandwich': ['sandwhich', 'sandwitch'],
  'breakfast': ['breakfest', 'brekfast'],
  'grilled': ['griled', 'grillled'],
  'scrambled': ['scrambeld', 'scambled'],
  'burrito': ['burito', 'buritto'],
  'oatmeal': ['oatmal', 'oatmeel'],
  'avocado': ['avacado', 'avocodo'],
  'broccoli': ['brocoli', 'brocolli'],
  'restaurant': ['restaraunt', 'resturant'],
};

// ============================================================================
// POLISHED FOOD MAPPINGS
// Maps sloppy raw inputs to structured, polished food items with realistic macros
// ============================================================================

interface PolishedFoodItem {
  description: string;
  portion: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface PolishedFoodEntry {
  rawInput: string;
  items: PolishedFoodItem[];
}

const POLISHED_FOODS: Record<string, Record<string, PolishedFoodEntry[]>> = {
  shorthand: {
    breakfast: [
      { rawInput: 'eggs and toast', items: [
        { description: 'Scrambled Eggs', portion: '2 large', calories: 182, protein: 12, carbs: 2, fat: 14 },
        { description: 'Buttered Toast', portion: '2 slices', calories: 186, protein: 4, carbs: 26, fat: 8 },
      ]},
      { rawInput: '2 eggs scrambled', items: [
        { description: 'Scrambled Eggs', portion: '2 large', calories: 182, protein: 12, carbs: 2, fat: 14 },
      ]},
      { rawInput: 'oatmeal with banana', items: [
        { description: 'Oatmeal', portion: '1 cup cooked', calories: 158, protein: 6, carbs: 27, fat: 3 },
        { description: 'Banana', portion: '1 medium', calories: 105, protein: 1, carbs: 27, fat: 0 },
      ]},
      { rawInput: 'cereal with milk', items: [
        { description: 'Breakfast Cereal', portion: '1 cup', calories: 150, protein: 3, carbs: 33, fat: 1 },
        { description: 'Milk', portion: '1 cup 2%', calories: 122, protein: 8, carbs: 12, fat: 5 },
      ]},
      { rawInput: 'yogurt and granola', items: [
        { description: 'Greek Yogurt', portion: '1 cup plain', calories: 130, protein: 17, carbs: 8, fat: 4 },
        { description: 'Granola', portion: '1/2 cup', calories: 210, protein: 5, carbs: 34, fat: 7 },
      ]},
      { rawInput: 'bagel with cream cheese', items: [
        { description: 'Plain Bagel', portion: '1 large', calories: 277, protein: 10, carbs: 54, fat: 2 },
        { description: 'Cream Cheese', portion: '2 tbsp', calories: 99, protein: 2, carbs: 2, fat: 10 },
      ]},
      { rawInput: 'avocado toast', items: [
        { description: 'Avocado Toast', portion: '2 slices whole wheat', calories: 320, protein: 8, carbs: 28, fat: 22 },
      ]},
      { rawInput: 'protein shake', items: [
        { description: 'Whey Protein Shake', portion: '1 scoop with water', calories: 120, protein: 24, carbs: 3, fat: 1 },
      ]},
      { rawInput: 'overnight oats', items: [
        { description: 'Overnight Oats', portion: '1 jar with berries', calories: 340, protein: 12, carbs: 52, fat: 10 },
      ]},
      { rawInput: 'english muffin with pb', items: [
        { description: 'English Muffin', portion: '1 whole wheat', calories: 134, protein: 5, carbs: 26, fat: 1 },
        { description: 'Peanut Butter', portion: '2 tbsp', calories: 188, protein: 8, carbs: 6, fat: 16 },
      ]},
    ],
    lunch: [
      { rawInput: 'turkey sandwich', items: [
        { description: 'Turkey Sandwich', portion: 'on whole wheat with lettuce, tomato', calories: 380, protein: 28, carbs: 36, fat: 12 },
      ]},
      { rawInput: 'salad with chicken', items: [
        { description: 'Grilled Chicken Salad', portion: 'mixed greens, veggies', calories: 350, protein: 32, carbs: 18, fat: 16 },
      ]},
      { rawInput: 'leftover pasta', items: [
        { description: 'Pasta with Marinara', portion: '2 cups', calories: 420, protein: 14, carbs: 72, fat: 8 },
      ]},
      { rawInput: 'soup and bread', items: [
        { description: 'Chicken Noodle Soup', portion: '1.5 cups', calories: 180, protein: 12, carbs: 20, fat: 5 },
        { description: 'Crusty Bread', portion: '1 slice', calories: 120, protein: 4, carbs: 22, fat: 2 },
      ]},
      { rawInput: 'burrito bowl', items: [
        { description: 'Burrito Bowl', portion: 'rice, beans, chicken, salsa', calories: 580, protein: 38, carbs: 62, fat: 18 },
      ]},
      { rawInput: 'sushi (8 pieces)', items: [
        { description: 'Salmon Sushi Roll', portion: '8 pieces', calories: 320, protein: 16, carbs: 44, fat: 8 },
      ]},
      { rawInput: 'grilled cheese', items: [
        { description: 'Grilled Cheese Sandwich', portion: '1 sandwich', calories: 440, protein: 16, carbs: 34, fat: 28 },
      ]},
      { rawInput: 'chicken wrap', items: [
        { description: 'Grilled Chicken Wrap', portion: 'with veggies', calories: 420, protein: 30, carbs: 38, fat: 16 },
      ]},
      { rawInput: 'poke bowl', items: [
        { description: 'Ahi Tuna Poke Bowl', portion: 'with rice and veggies', calories: 520, protein: 32, carbs: 58, fat: 16 },
      ]},
      { rawInput: 'mediterranean bowl', items: [
        { description: 'Mediterranean Bowl', portion: 'falafel, hummus, tabbouleh', calories: 580, protein: 18, carbs: 62, fat: 28 },
      ]},
    ],
    dinner: [
      { rawInput: 'salmon and veggies', items: [
        { description: 'Baked Salmon', portion: '6 oz fillet', calories: 350, protein: 38, carbs: 0, fat: 20 },
        { description: 'Roasted Vegetables', portion: '1.5 cups mixed', calories: 120, protein: 3, carbs: 18, fat: 5 },
      ]},
      { rawInput: 'chicken stir fry', items: [
        { description: 'Chicken Stir Fry', portion: 'with vegetables and sauce', calories: 420, protein: 34, carbs: 28, fat: 18 },
      ]},
      { rawInput: 'pasta with meat sauce', items: [
        { description: 'Spaghetti Bolognese', portion: '2 cups', calories: 580, protein: 28, carbs: 68, fat: 20 },
      ]},
      { rawInput: 'tacos (3)', items: [
        { description: 'Beef Tacos', portion: '3 soft shell', calories: 540, protein: 28, carbs: 42, fat: 28 },
      ]},
      { rawInput: 'pizza (2 slices)', items: [
        { description: 'Pepperoni Pizza', portion: '2 large slices', calories: 560, protein: 22, carbs: 56, fat: 28 },
      ]},
      { rawInput: 'burger and fries', items: [
        { description: 'Cheeseburger', portion: '1/4 lb with bun', calories: 530, protein: 28, carbs: 40, fat: 30 },
        { description: 'French Fries', portion: 'medium', calories: 380, protein: 5, carbs: 48, fat: 18 },
      ]},
      { rawInput: 'grilled chicken and rice', items: [
        { description: 'Grilled Chicken Breast', portion: '6 oz', calories: 280, protein: 52, carbs: 0, fat: 6 },
        { description: 'Brown Rice', portion: '1 cup cooked', calories: 216, protein: 5, carbs: 45, fat: 2 },
      ]},
      { rawInput: 'shrimp scampi', items: [
        { description: 'Shrimp Scampi', portion: 'over linguine', calories: 620, protein: 34, carbs: 58, fat: 26 },
      ]},
      { rawInput: 'beef and broccoli', items: [
        { description: 'Beef and Broccoli', portion: 'with steamed rice', calories: 520, protein: 32, carbs: 48, fat: 22 },
      ]},
      { rawInput: 'baked chicken thighs', items: [
        { description: 'Baked Chicken Thighs', portion: '2 thighs bone-in', calories: 440, protein: 42, carbs: 0, fat: 28 },
      ]},
    ],
    snack: [
      { rawInput: 'apple with peanut butter', items: [
        { description: 'Apple', portion: '1 medium', calories: 95, protein: 0, carbs: 25, fat: 0 },
        { description: 'Peanut Butter', portion: '2 tbsp', calories: 188, protein: 8, carbs: 6, fat: 16 },
      ]},
      { rawInput: 'handful of almonds', items: [
        { description: 'Almonds', portion: '1/4 cup (about 23)', calories: 207, protein: 8, carbs: 7, fat: 18 },
      ]},
      { rawInput: 'protein bar', items: [
        { description: 'Protein Bar', portion: '1 bar', calories: 200, protein: 20, carbs: 22, fat: 7 },
      ]},
      { rawInput: 'banana', items: [
        { description: 'Banana', portion: '1 medium', calories: 105, protein: 1, carbs: 27, fat: 0 },
      ]},
      { rawInput: 'greek yogurt', items: [
        { description: 'Greek Yogurt', portion: '1 cup plain', calories: 130, protein: 17, carbs: 8, fat: 4 },
      ]},
      { rawInput: 'cheese stick', items: [
        { description: 'String Cheese', portion: '1 stick', calories: 80, protein: 7, carbs: 1, fat: 6 },
      ]},
      { rawInput: 'carrots and hummus', items: [
        { description: 'Baby Carrots', portion: '1 cup', calories: 52, protein: 1, carbs: 12, fat: 0 },
        { description: 'Hummus', portion: '1/4 cup', calories: 140, protein: 5, carbs: 12, fat: 9 },
      ]},
      { rawInput: 'trail mix', items: [
        { description: 'Trail Mix', portion: '1/4 cup', calories: 173, protein: 5, carbs: 16, fat: 11 },
      ]},
      { rawInput: 'popcorn', items: [
        { description: 'Popcorn', portion: '3 cups air-popped', calories: 93, protein: 3, carbs: 19, fat: 1 },
      ]},
      { rawInput: 'rice cakes', items: [
        { description: 'Rice Cakes', portion: '2 cakes', calories: 70, protein: 2, carbs: 14, fat: 1 },
      ]},
    ],
  },
  casual: {
    breakfast: [
      { rawInput: 'made scrambled eggs with cheddar cheese and some toast', items: [
        { description: 'Scrambled Eggs with Cheddar', portion: '2 eggs with 1 oz cheese', calories: 290, protein: 18, carbs: 2, fat: 22 },
        { description: 'Buttered Toast', portion: '2 slices', calories: 186, protein: 4, carbs: 26, fat: 8 },
      ]},
      { rawInput: 'had a big bowl of oatmeal with blueberries and honey', items: [
        { description: 'Oatmeal with Blueberries', portion: '1.5 cups with 1 tbsp honey', calories: 320, protein: 8, carbs: 62, fat: 5 },
      ]},
      { rawInput: 'grabbed a breakfast sandwich from the cafe', items: [
        { description: 'Bacon Egg & Cheese Sandwich', portion: '1 sandwich on croissant', calories: 520, protein: 22, carbs: 38, fat: 32 },
      ]},
      { rawInput: 'just coffee and a banana this morning', items: [
        { description: 'Black Coffee', portion: '12 oz', calories: 5, protein: 0, carbs: 1, fat: 0 },
        { description: 'Banana', portion: '1 medium', calories: 105, protein: 1, carbs: 27, fat: 0 },
      ]},
      { rawInput: 'smoothie with spinach, banana, protein powder', items: [
        { description: 'Green Protein Smoothie', portion: '16 oz', calories: 280, protein: 28, carbs: 35, fat: 4 },
      ]},
      { rawInput: 'french toast with maple syrup (2 pieces)', items: [
        { description: 'French Toast', portion: '2 slices with syrup', calories: 420, protein: 12, carbs: 62, fat: 14 },
      ]},
      { rawInput: 'breakfast burrito with eggs, cheese, and salsa', items: [
        { description: 'Breakfast Burrito', portion: '1 large with eggs, cheese, salsa', calories: 480, protein: 22, carbs: 42, fat: 24 },
      ]},
    ],
    lunch: [
      { rawInput: 'got chipotle - chicken bowl with guac', items: [
        { description: 'Chipotle Chicken Burrito Bowl', portion: 'with rice, beans, guacamole, salsa', calories: 740, protein: 44, carbs: 72, fat: 28 },
      ]},
      { rawInput: 'ate leftover chicken stir fry from last night', items: [
        { description: 'Leftover Chicken Stir Fry', portion: '1.5 cups with vegetables', calories: 380, protein: 32, carbs: 24, fat: 16 },
      ]},
      { rawInput: 'had a big salad with grilled chicken and ranch', items: [
        { description: 'Grilled Chicken Salad', portion: 'large with ranch dressing', calories: 520, protein: 38, carbs: 18, fat: 34 },
      ]},
      { rawInput: 'sandwich from the deli, turkey and swiss', items: [
        { description: 'Turkey & Swiss Deli Sandwich', portion: 'on sourdough with mayo', calories: 540, protein: 34, carbs: 42, fat: 26 },
      ]},
      { rawInput: 'ramen from the place down the street', items: [
        { description: 'Tonkotsu Ramen', portion: 'large bowl with egg and chashu', calories: 680, protein: 32, carbs: 78, fat: 28 },
      ]},
      { rawInput: 'meal prep chicken and rice', items: [
        { description: 'Meal Prep Chicken Breast', portion: '6 oz', calories: 280, protein: 52, carbs: 0, fat: 6 },
        { description: 'Jasmine Rice', portion: '1 cup', calories: 205, protein: 4, carbs: 45, fat: 0 },
      ]},
      { rawInput: 'panera bread bowl soup', items: [
        { description: 'Panera Broccoli Cheddar Soup', portion: 'in bread bowl', calories: 720, protein: 24, carbs: 88, fat: 28 },
      ]},
    ],
    dinner: [
      { rawInput: 'cooked salmon in the air fryer with roasted veggies', items: [
        { description: 'Air Fried Salmon', portion: '6 oz fillet', calories: 350, protein: 38, carbs: 0, fat: 20 },
        { description: 'Roasted Mixed Vegetables', portion: '1.5 cups', calories: 140, protein: 4, carbs: 20, fat: 6 },
      ]},
      { rawInput: 'ordered thai food - pad thai and spring rolls', items: [
        { description: 'Pad Thai with Shrimp', portion: '1 order', calories: 520, protein: 22, carbs: 68, fat: 18 },
        { description: 'Fresh Spring Rolls', portion: '2 rolls', calories: 160, protein: 6, carbs: 28, fat: 3 },
      ]},
      { rawInput: 'homemade tacos with ground beef, like 3 of them', items: [
        { description: 'Ground Beef Tacos', portion: '3 tacos with toppings', calories: 620, protein: 32, carbs: 48, fat: 34 },
      ]},
      { rawInput: 'grilled chicken breast with quinoa and asparagus', items: [
        { description: 'Grilled Chicken Breast', portion: '6 oz', calories: 280, protein: 52, carbs: 0, fat: 6 },
        { description: 'Quinoa', portion: '1 cup cooked', calories: 222, protein: 8, carbs: 39, fat: 4 },
        { description: 'Grilled Asparagus', portion: '1 cup', calories: 40, protein: 4, carbs: 7, fat: 0 },
      ]},
      { rawInput: 'spaghetti and meatballs, pretty big portion', items: [
        { description: 'Spaghetti and Meatballs', portion: 'large serving with 4 meatballs', calories: 780, protein: 38, carbs: 82, fat: 32 },
      ]},
      { rawInput: 'went out for sushi, had about 12 pieces plus miso soup', items: [
        { description: 'Assorted Sushi', portion: '12 pieces nigiri/maki', calories: 480, protein: 24, carbs: 66, fat: 12 },
        { description: 'Miso Soup', portion: '1 cup', calories: 60, protein: 4, carbs: 6, fat: 2 },
      ]},
      { rawInput: 'made a big stir fry with tofu and vegetables', items: [
        { description: 'Tofu Vegetable Stir Fry', portion: '2 cups with sauce', calories: 380, protein: 22, carbs: 32, fat: 18 },
      ]},
    ],
    snack: [
      { rawInput: 'needed something sweet so had some dark chocolate', items: [
        { description: 'Dark Chocolate', portion: '2 squares (about 1 oz)', calories: 155, protein: 2, carbs: 13, fat: 11 },
      ]},
      { rawInput: 'protein shake after workout', items: [
        { description: 'Whey Protein Shake', portion: '1 scoop with milk', calories: 220, protein: 28, carbs: 12, fat: 5 },
      ]},
      { rawInput: 'handful of mixed nuts from the jar', items: [
        { description: 'Mixed Nuts', portion: '1/4 cup', calories: 210, protein: 6, carbs: 8, fat: 18 },
      ]},
      { rawInput: 'an apple and some peanut butter', items: [
        { description: 'Apple with Peanut Butter', portion: '1 medium apple with 2 tbsp PB', calories: 283, protein: 8, carbs: 31, fat: 16 },
      ]},
      { rawInput: 'cheese and crackers', items: [
        { description: 'Cheese and Crackers', portion: '1.5 oz cheese, 6 crackers', calories: 260, protein: 10, carbs: 18, fat: 16 },
      ]},
      { rawInput: 'leftover halloween candy (2 pieces)', items: [
        { description: 'Chocolate Candy', portion: '2 fun-size bars', calories: 160, protein: 2, carbs: 22, fat: 8 },
      ]},
    ],
  },
  brand: {
    breakfast: [
      { rawInput: 'Starbucks grande oat milk latte', items: [
        { description: 'Starbucks Grande Oat Milk Latte', portion: '16 oz', calories: 270, protein: 6, carbs: 43, fat: 7 },
      ]},
      { rawInput: 'Chobani greek yogurt strawberry', items: [
        { description: 'Chobani Greek Yogurt Strawberry', portion: '5.3 oz container', calories: 120, protein: 12, carbs: 14, fat: 2 },
      ]},
    ],
    lunch: [
      { rawInput: "Trader Joe's mandarin orange chicken", items: [
        { description: "Trader Joe's Mandarin Orange Chicken", portion: '1 cup', calories: 320, protein: 16, carbs: 38, fat: 12 },
      ]},
      { rawInput: 'Costco rotisserie chicken (1/4)', items: [
        { description: 'Costco Rotisserie Chicken', portion: '1/4 bird', calories: 380, protein: 48, carbs: 0, fat: 20 },
      ]},
    ],
    dinner: [
      { rawInput: "Dunkin' bacon egg cheese on english muffin", items: [
        { description: "Dunkin' Bacon Egg & Cheese", portion: 'on English muffin', calories: 470, protein: 20, carbs: 36, fat: 28 },
      ]},
    ],
    snack: [
      { rawInput: 'Quest protein bar cookies and cream', items: [
        { description: 'Quest Protein Bar', portion: 'Cookies & Cream', calories: 200, protein: 21, carbs: 22, fat: 8 },
      ]},
      { rawInput: 'KIND dark chocolate nuts & sea salt bar', items: [
        { description: 'KIND Bar', portion: 'Dark Chocolate Nuts & Sea Salt', calories: 200, protein: 6, carbs: 16, fat: 15 },
      ]},
      { rawInput: 'Clif chocolate chip bar', items: [
        { description: 'Clif Bar Chocolate Chip', portion: '1 bar', calories: 250, protein: 9, carbs: 44, fat: 5 },
      ]},
      { rawInput: 'RXBAR chocolate sea salt', items: [
        { description: 'RXBAR Chocolate Sea Salt', portion: '1 bar', calories: 210, protein: 12, carbs: 23, fat: 9 },
      ]},
    ],
  },
  recipe: {
    dinner: [
      { rawInput: 'made this: https://www.bonappetit.com/recipe/cacio-e-pepe', items: [
        { description: 'Cacio e Pepe', portion: 'homemade, 1 large serving', calories: 520, protein: 18, carbs: 62, fat: 22 },
      ]},
      { rawInput: 'made this: https://www.seriouseats.com/the-best-slow-cooked-bolognese-sauce-recipe', items: [
        { description: 'Slow-Cooked Bolognese', portion: 'over pasta', calories: 620, protein: 32, carbs: 58, fat: 28 },
      ]},
      { rawInput: 'made this: https://www.allrecipes.com/recipe/23600/worlds-best-lasagna/', items: [
        { description: 'Homemade Lasagna', portion: '1 large slice', calories: 480, protein: 28, carbs: 38, fat: 24 },
      ]},
      { rawInput: 'made this: https://minimalistbaker.com/easy-pad-thai/', items: [
        { description: 'Homemade Pad Thai', portion: '1 large serving', calories: 450, protein: 18, carbs: 58, fat: 16 },
      ]},
    ],
    snack: [
      { rawInput: 'made this: https://cooking.nytimes.com/recipes/1015819-chocolate-chip-cookies', items: [
        { description: 'Homemade Chocolate Chip Cookies', portion: '2 cookies', calories: 280, protein: 3, carbs: 36, fat: 14 },
      ]},
      { rawInput: 'made this: https://natashaskitchen.com/banana-bread-recipe-video/', items: [
        { description: 'Homemade Banana Bread', portion: '1 slice', calories: 220, protein: 3, carbs: 34, fat: 8 },
      ]},
    ],
  },
  barcode: {
    snack: [
      { rawInput: 'Scanned: 049000000443', items: [
        { description: 'Coca-Cola Classic', portion: '12 oz can', calories: 140, protein: 0, carbs: 39, fat: 0 },
      ]},
      { rawInput: 'Scanned: 041270003209', items: [
        { description: 'La Croix Sparkling Water', portion: '12 oz can', calories: 0, protein: 0, carbs: 0, fat: 0 },
      ]},
      { rawInput: 'Scanned: 818780010122', items: [
        { description: 'RXBar Chocolate Sea Salt', portion: '1 bar', calories: 210, protein: 12, carbs: 23, fat: 9 },
      ]},
      { rawInput: 'Scanned: 888849000562', items: [
        { description: 'Quest Protein Bar', portion: '1 bar', calories: 200, protein: 21, carbs: 22, fat: 8 },
      ]},
    ],
    breakfast: [
      { rawInput: 'Scanned: 038000138416', items: [
        { description: "Kellogg's Frosted Flakes", portion: '1 cup with milk', calories: 290, protein: 9, carbs: 52, fat: 5 },
      ]},
      { rawInput: 'Scanned: 041196010176', items: [
        { description: 'Oikos Triple Zero Yogurt', portion: '5.3 oz container', calories: 120, protein: 15, carbs: 14, fat: 0 },
      ]},
    ],
    lunch: [
      { rawInput: 'Scanned: 028400064057', items: [
        { description: 'Doritos Nacho Cheese', portion: '1 oz bag', calories: 150, protein: 2, carbs: 18, fat: 8 },
      ]},
    ],
    dinner: [
      { rawInput: 'Scanned: 013000006408', items: [
        { description: 'Heinz Ketchup', portion: '1 tbsp (with meal)', calories: 20, protein: 0, carbs: 5, fat: 0 },
      ]},
    ],
  },
};

// ============================================================================
// EXERCISE ABBREVIATIONS AND CASUAL FORMATS
// Maps canonical exercise names to sloppy/abbreviated variations
// ============================================================================

const EXERCISE_ABBREVIATIONS: Record<string, string[]> = {
  'Lat Pulldown': ['lat pull', 'pulldown', 'lats', 'pull down'],
  'Chest Press Machine': ['chest press', 'machine press'],
  'Leg Press': ['legpress', 'leg press machine'],
  'Leg Extension': ['leg ext', 'extensions', 'quads'],
  'Leg Curl': ['hamstring curl', 'leg curls', 'hams'],
  'Cable Row': ['seated row', 'cable rows', 'rows'],
  'Shoulder Press Machine': ['shoulder machine', 'machine shoulder'],
  'Squat': ['squats', 'back squat', 'bb squat'],
  'Bench Press': ['bench', 'bp', 'flat bench', 'bb bench'],
  'Deadlift': ['deads', 'dl', 'conventional dl'],
  'Romanian Deadlift': ['rdl', 'romanian dl', 'stiff leg'],
  'Bicep Curl': ['curls', 'biceps', 'bi curls', 'arm curls'],
  'Shoulder Press': ['ohp', 'overhead press', 'military'],
  'Dumbbell Row': ['db row', 'one arm row', 'db rows'],
  'Lateral Raise': ['side raise', 'laterals', 'side delts'],
  'Hammer Curl': ['hammers', 'hammer curls', 'neutral curls'],
};

// Different casual input format generators
function generateCasualExerciseInput(
  exerciseName: string,
  weight: number,
  sets: number,
  reps: number
): string {
  // Get an abbreviation or use lowercase name
  const abbreviations = EXERCISE_ABBREVIATIONS[exerciseName];
  const name = abbreviations 
    ? randomChoice(abbreviations) 
    : exerciseName.toLowerCase().replace(/ /g, '');
  
  // Pick a random format
  const formats = [
    () => `${name} ${weight} ${sets}x${reps}`,           // "bench 135 3x10"
    () => `${name} ${sets}x${reps} @ ${weight}`,         // "rdl 4x8 @ 95"
    () => `${name} ${weight}lb ${sets}x${reps}`,         // "squats 185lb 4x6"
    () => `${name} ${sets}x${reps} ${weight}lbs`,        // "ohp 3x8 95lbs"
    () => `${name} ${weight} ${sets} sets ${reps} reps`, // "lat pull 80 4 sets 10 reps"
    () => `${name} ${sets}sets ${reps}reps ${weight}`,   // "curls 3sets 10reps 25"
  ];
  
  return randomChoice(formats)();
}

// ============================================================================
// REMAINING ORIGINAL DATA STRUCTURES (for reference/compatibility)
// ============================================================================

// Exercises by category
const EXERCISES = {
  machine: [
    { key: 'lat_pulldown', name: 'Lat Pulldown', startWeight: 70, maxProgress: 25 },
    { key: 'chest_press_machine', name: 'Chest Press Machine', startWeight: 50, maxProgress: 30 },
    { key: 'leg_press', name: 'Leg Press', startWeight: 90, maxProgress: 90 },
    { key: 'leg_extension', name: 'Leg Extension', startWeight: 40, maxProgress: 30 },
    { key: 'leg_curl', name: 'Leg Curl', startWeight: 35, maxProgress: 25 },
    { key: 'seated_row', name: 'Cable Row', startWeight: 50, maxProgress: 25 },
    { key: 'shoulder_press_machine', name: 'Shoulder Press Machine', startWeight: 30, maxProgress: 25 },
  ],
  compound: [
    { key: 'squat', name: 'Squat', startWeight: 65, maxProgress: 50 },
    { key: 'bench_press', name: 'Bench Press', startWeight: 65, maxProgress: 30 },
    { key: 'deadlift', name: 'Deadlift', startWeight: 95, maxProgress: 60 },
    { key: 'romanian_deadlift', name: 'Romanian Deadlift', startWeight: 65, maxProgress: 40 },
  ],
  freeWeight: [
    { key: 'bicep_curl', name: 'Bicep Curl', startWeight: 15, maxProgress: 10 },
    { key: 'shoulder_press', name: 'Shoulder Press', startWeight: 20, maxProgress: 15 },
    { key: 'dumbbell_row', name: 'Dumbbell Row', startWeight: 25, maxProgress: 15 },
    { key: 'lateral_raise', name: 'Lateral Raise', startWeight: 10, maxProgress: 10 },
    { key: 'hammer_curl', name: 'Hammer Curl', startWeight: 15, maxProgress: 10 },
  ],
};

// Saved meal templates
const SAVED_MEAL_TEMPLATES = [
  { name: 'Morning Coffee', items: ['grande oat milk latte', 'banana'] },
  { name: 'Chipotle Bowl', items: ['chicken burrito bowl with rice, beans, salsa, guac'] },
  { name: 'Weeknight Salmon', items: ['6oz baked salmon', 'roasted vegetables', 'brown rice'] },
  { name: 'Protein Snack', items: ['greek yogurt with granola', 'protein bar'] },
  { name: 'Pizza Night', items: ['3 slices pepperoni pizza', 'side salad with ranch'] },
  { name: 'Quick Breakfast', items: ['2 scrambled eggs', 'toast with butter', 'orange juice'] },
  { name: 'Lunch Salad', items: ['mixed greens with grilled chicken', 'balsamic dressing', 'croutons'] },
  { name: 'Post-Workout', items: ['protein shake with banana', 'peanut butter toast'] },
];

// Saved routine templates
const SAVED_ROUTINE_TEMPLATES = [
  { name: 'Upper Body Day', exercises: ['bench_press', 'lat_pulldown', 'shoulder_press', 'bicep_curl', 'seated_row'] },
  { name: 'Leg Day', exercises: ['squat', 'leg_press', 'leg_extension', 'leg_curl', 'calf_raise'] },
  { name: 'Full Body Quick', exercises: ['squat', 'bench_press', 'lat_pulldown', 'bicep_curl'] },
  { name: 'Push Day', exercises: ['bench_press', 'shoulder_press_machine', 'chest_press_machine', 'lateral_raise'] },
  { name: 'Pull Day', exercises: ['lat_pulldown', 'seated_row', 'bicep_curl', 'hammer_curl', 'dumbbell_row'] },
  { name: 'Machine Circuit', exercises: ['chest_press_machine', 'lat_pulldown', 'leg_press', 'shoulder_press_machine'] },
];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function selectRandomDays(startDate: Date, endDate: Date, count: number): Date[] {
  const days: Date[] = [];
  const current = new Date(startDate);
  while (current <= endDate) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  return shuffleArray(days).slice(0, Math.min(count, days.length)).sort((a, b) => a.getTime() - b.getTime());
}

function applyTypo(text: string): string {
  for (const [word, typos] of Object.entries(COMMON_TYPOS)) {
    if (text.toLowerCase().includes(word) && Math.random() < 0.3) {
      const regex = new RegExp(word, 'gi');
      return text.replace(regex, randomChoice(typos));
    }
  }
  return text;
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

// ============================================================================
// FOOD GENERATION
// ============================================================================

interface FoodConfig {
  barcodeScanPercent: number;
  shorthandPercent: number;
  casualWithTyposPercent: number;
  recipeLinksPercent: number;
  brandNamesPercent: number;
}

const DEFAULT_FOOD_CONFIG: FoodConfig = {
  barcodeScanPercent: 15,
  shorthandPercent: 40,
  casualWithTyposPercent: 20,
  recipeLinksPercent: 5,
  brandNamesPercent: 20,
};

function selectFoodEntryType(config: FoodConfig): 'barcode' | 'shorthand' | 'casual' | 'recipe' | 'brand' {
  const rand = Math.random() * 100;
  let cumulative = 0;
  
  cumulative += config.barcodeScanPercent;
  if (rand < cumulative) return 'barcode';
  
  cumulative += config.shorthandPercent;
  if (rand < cumulative) return 'shorthand';
  
  cumulative += config.casualWithTyposPercent;
  if (rand < cumulative) return 'casual';
  
  cumulative += config.recipeLinksPercent;
  if (rand < cumulative) return 'recipe';
  
  return 'brand';
}

interface GeneratedFoodEntry {
  rawInput: string;
  items: PolishedFoodItem[];
}

function generateFoodEntriesForDay(config: FoodConfig): GeneratedFoodEntry[] {
  const entries: GeneratedFoodEntry[] = [];
  const mealTypes: Array<'breakfast' | 'lunch' | 'dinner' | 'snack'> = ['breakfast', 'lunch', 'dinner'];
  
  // Maybe add a snack (60% chance)
  if (Math.random() < 0.6) {
    mealTypes.push('snack');
  }
  
  for (const mealType of mealTypes) {
    const entryType = selectFoodEntryType(config);
    
    // Get the appropriate category from POLISHED_FOODS
    const category = POLISHED_FOODS[entryType];
    if (!category) {
      // Fallback to shorthand
      const fallbackMeals = POLISHED_FOODS.shorthand[mealType];
      if (fallbackMeals?.length) {
        const entry = randomChoice(fallbackMeals);
        entries.push({ rawInput: entry.rawInput, items: entry.items });
      }
      continue;
    }
    
    // Get meals for this meal type, or fall back to any available
    let mealsForType = category[mealType];
    if (!mealsForType || mealsForType.length === 0) {
      // Try to find any meal type in this category
      const availableTypes = Object.keys(category) as Array<'breakfast' | 'lunch' | 'dinner' | 'snack'>;
      if (availableTypes.length > 0) {
        mealsForType = category[randomChoice(availableTypes)];
      }
    }
    
    if (mealsForType && mealsForType.length > 0) {
      const entry = randomChoice(mealsForType);
      // Apply typo to casual entries sometimes
      const rawInput = entryType === 'casual' && Math.random() < 0.3 
        ? applyTypo(entry.rawInput) 
        : entry.rawInput;
      entries.push({ rawInput, items: entry.items });
    }
  }
  
  return entries;
}

// ============================================================================
// WEIGHT GENERATION
// ============================================================================

interface WeightConfig {
  machinePercent: number;
  compoundPercent: number;
  freeWeightPercent: number;
  progressionMultiplier: number;
}

const DEFAULT_WEIGHT_CONFIG: WeightConfig = {
  machinePercent: 40,
  compoundPercent: 30,
  freeWeightPercent: 30,
  progressionMultiplier: 1.0,
};

function selectExerciseCategory(config: WeightConfig): 'machine' | 'compound' | 'freeWeight' {
  const rand = Math.random() * 100;
  let cumulative = 0;
  
  cumulative += config.machinePercent;
  if (rand < cumulative) return 'machine';
  
  cumulative += config.compoundPercent;
  if (rand < cumulative) return 'compound';
  
  return 'freeWeight';
}

function calculateWeight(
  baseWeight: number,
  maxProgress: number,
  dayIndex: number,
  totalDays: number,
  progressionMultiplier: number
): number {
  const progress = (dayIndex / Math.max(totalDays, 1)) * maxProgress * progressionMultiplier;
  const variance = (Math.random() - 0.5) * 5;
  return Math.max(5, Math.round((baseWeight + progress + variance) / 5) * 5);
}

function calculateSetsReps(dayIndex: number, totalDays: number): { sets: number; reps: number } {
  const progress = dayIndex / Math.max(totalDays, 1);
  return {
    sets: progress > 0.5 ? 4 : 3,
    reps: Math.min(12, 8 + Math.floor(progress * 4)),
  };
}

interface GeneratedExercise {
  exercise_key: string;
  description: string;
  sets: number;
  reps: number;
  weight_lbs: number;
}

function generateWeightEntriesForDay(
  config: WeightConfig,
  dayIndex: number,
  totalDays: number
): { rawInput: string; exercises: GeneratedExercise[] } {
  const exerciseCount = randomInt(3, 6);
  const usedKeys = new Set<string>();
  const exercises: GeneratedExercise[] = [];
  const inputParts: string[] = [];
  
  for (let i = 0; i < exerciseCount; i++) {
    const category = selectExerciseCategory(config);
    const availableExercises = EXERCISES[category].filter(e => !usedKeys.has(e.key));
    
    if (availableExercises.length === 0) continue;
    
    const exercise = randomChoice(availableExercises);
    usedKeys.add(exercise.key);
    
    const { sets, reps } = calculateSetsReps(dayIndex, totalDays);
    const weight = calculateWeight(
      exercise.startWeight,
      exercise.maxProgress,
      dayIndex,
      totalDays,
      config.progressionMultiplier
    );
    
    exercises.push({
      exercise_key: exercise.key,
      description: exercise.name,
      sets,
      reps,
      weight_lbs: weight,
    });
    
    // Generate casual/sloppy input using abbreviations
    inputParts.push(generateCasualExerciseInput(exercise.name, weight, sets, reps));
  }
  
  // Combine into a single raw input with varied separators
  const separator = randomChoice([', ', '\n', ' | ', '; ']);
  const rawInput = inputParts.join(separator);
  
  return { rawInput, exercises };
}

// ============================================================================
// SAVED ITEMS GENERATION
// ============================================================================

function generateSavedMeals(count: number): Array<{ name: string; original_input: string; food_items: unknown[]; use_count: number }> {
  const templates = shuffleArray(SAVED_MEAL_TEMPLATES).slice(0, count);
  
  return templates.map(template => ({
    name: template.name,
    original_input: template.items.join(', '),
    food_items: template.items.map((item, idx) => ({
      uid: `saved-${Date.now()}-${idx}`,
      description: item,
      calories: randomInt(100, 500),
      protein: randomInt(5, 40),
      carbs: randomInt(10, 60),
      fat: randomInt(3, 25),
    })),
    use_count: randomInt(2, 10),
  }));
}

function generateSavedRoutines(count: number): Array<{ name: string; original_input: string; exercise_sets: unknown[]; use_count: number }> {
  const templates = shuffleArray(SAVED_ROUTINE_TEMPLATES).slice(0, count);
  
  return templates.map(template => {
    const exerciseSets = template.exercises.map(key => {
      // Find exercise data from all categories
      const allExercises = [...EXERCISES.machine, ...EXERCISES.compound, ...EXERCISES.freeWeight];
      const exercise = allExercises.find(e => e.key === key) || { key, name: key, startWeight: 50 };
      
      return {
        exercise_key: exercise.key,
        description: exercise.name,
        sets: randomInt(3, 4),
        reps: randomInt(8, 12),
        weight_lbs: exercise.startWeight,
      };
    });
    
    return {
      name: template.name,
      original_input: template.exercises.join(', '),
      exercise_sets: exerciseSets,
      use_count: randomInt(3, 8),
    };
  });
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

interface RequestParams {
  startDate?: string;
  endDate?: string;
  daysToPopulate?: number;
  generateFood?: boolean;
  generateWeights?: boolean;
  generateSavedMeals?: number;
  generateSavedRoutines?: number;
  clearExisting?: boolean;
  food?: Partial<FoodConfig>;
  weights?: Partial<WeightConfig>;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Validate authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Client for auth validation
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claimsData.claims.sub as string;

    // Check admin role
    const { data: isAdmin, error: roleError } = await authClient.rpc('has_role', {
      _user_id: userId,
      _role: 'admin',
    });

    if (roleError || !isAdmin) {
      console.error('Admin check failed:', roleError);
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Service role client for bypassing RLS
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    // Get demo user ID
    const { data: demoUsers, error: demoError } = await serviceClient
      .from('profiles')
      .select('id')
      .eq('is_read_only', true);

    if (demoError || !demoUsers || demoUsers.length === 0) {
      // Try to find by looking up in auth.users (service role can access)
      const { data: authData } = await serviceClient.auth.admin.listUsers();
      const demoUser = authData?.users?.find(u => u.email === DEMO_EMAIL);
      
      if (!demoUser) {
        return new Response(
          JSON.stringify({ error: 'Demo user not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Get demo user ID from auth
    const { data: authData } = await serviceClient.auth.admin.listUsers();
    const demoAuthUser = authData?.users?.find(u => u.email === DEMO_EMAIL);
    
    if (!demoAuthUser) {
      return new Response(
        JSON.stringify({ error: 'Demo user not found in auth' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const demoUserId = demoAuthUser.id;
    console.log('Found demo user:', demoUserId);

    // Parse request parameters
    let params: RequestParams = {};
    try {
      const body = await req.text();
      if (body) {
        params = JSON.parse(body);
      }
    } catch {
      // Empty body is fine, use defaults
    }

    // Apply defaults - extend 30 days into the future so demo always has "today" data
    const today = new Date();
    const ninetyDaysAgo = new Date(today);
    ninetyDaysAgo.setDate(today.getDate() - 90);
    
    const thirtyDaysFromNow = new Date(today);
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    const startDate = params.startDate ? new Date(params.startDate) : ninetyDaysAgo;
    const endDate = params.endDate ? new Date(params.endDate) : thirtyDaysFromNow;
    const daysToPopulate = params.daysToPopulate ?? 80; // Increased to cover extended range
    const generateFood = params.generateFood ?? true;
    const generateWeights = params.generateWeights ?? true;
    const savedMealsCount = params.generateSavedMeals ?? 5;
    const savedRoutinesCount = params.generateSavedRoutines ?? 4;
    const clearExisting = params.clearExisting ?? false;

    const foodConfig: FoodConfig = { ...DEFAULT_FOOD_CONFIG, ...params.food };
    const weightConfig: WeightConfig = { ...DEFAULT_WEIGHT_CONFIG, ...params.weights };

    console.log('Parameters:', {
      startDate: formatDate(startDate),
      endDate: formatDate(endDate),
      daysToPopulate,
      generateFood,
      generateWeights,
      savedMealsCount,
      savedRoutinesCount,
      clearExisting,
    });

    // Clear existing data if requested
    if (clearExisting) {
      console.log('Clearing existing data...');
      
      if (generateFood) {
        const { error: clearFoodError } = await serviceClient
          .from('food_entries')
          .delete()
          .eq('user_id', demoUserId)
          .gte('eaten_date', formatDate(startDate))
          .lte('eaten_date', formatDate(endDate));
        
        if (clearFoodError) console.error('Error clearing food:', clearFoodError);
      }

      if (generateWeights) {
        const { error: clearWeightError } = await serviceClient
          .from('weight_sets')
          .delete()
          .eq('user_id', demoUserId)
          .gte('logged_date', formatDate(startDate))
          .lte('logged_date', formatDate(endDate));
        
        if (clearWeightError) console.error('Error clearing weights:', clearWeightError);
      }

      if (savedMealsCount > 0) {
        const { error: clearMealsError } = await serviceClient
          .from('saved_meals')
          .delete()
          .eq('user_id', demoUserId);
        
        if (clearMealsError) console.error('Error clearing saved meals:', clearMealsError);
      }

      if (savedRoutinesCount > 0) {
        const { error: clearRoutinesError } = await serviceClient
          .from('saved_routines')
          .delete()
          .eq('user_id', demoUserId);
        
        if (clearRoutinesError) console.error('Error clearing saved routines:', clearRoutinesError);
      }
    }

    // Select random days within range
    const selectedDays = selectRandomDays(startDate, endDate, daysToPopulate);
    console.log(`Selected ${selectedDays.length} days to populate`);

    let foodEntriesCreated = 0;
    let weightSetsCreated = 0;

    // Generate data for each day
    for (let i = 0; i < selectedDays.length; i++) {
      const day = selectedDays[i];
      const dateStr = formatDate(day);

      // Generate food entries with polished items
      if (generateFood) {
        const foodEntries = generateFoodEntriesForDay(foodConfig);
        
        for (const entry of foodEntries) {
          // Calculate totals from items
          const totalCalories = entry.items.reduce((sum, item) => sum + item.calories, 0);
          const totalProtein = entry.items.reduce((sum, item) => sum + item.protein, 0);
          const totalCarbs = entry.items.reduce((sum, item) => sum + item.carbs, 0);
          const totalFat = entry.items.reduce((sum, item) => sum + item.fat, 0);
          
          const { error: foodError } = await serviceClient
            .from('food_entries')
            .insert({
              user_id: demoUserId,
              eaten_date: dateStr,
              raw_input: entry.rawInput,
              food_items: entry.items.map(item => ({
                uid: crypto.randomUUID(),
                description: item.description,
                portion: item.portion,
                calories: item.calories,
                protein: item.protein,
                carbs: item.carbs,
                fat: item.fat,
              })),
              total_calories: totalCalories,
              total_protein: totalProtein,
              total_carbs: totalCarbs,
              total_fat: totalFat,
            });

          if (foodError) {
            console.error('Error inserting food entry:', foodError);
          } else {
            foodEntriesCreated++;
          }
        }
      }

      // Generate weight entries (roughly every other day)
      if (generateWeights && Math.random() < 0.5) {
        const { rawInput, exercises } = generateWeightEntriesForDay(
          weightConfig,
          i,
          selectedDays.length
        );
        
        const entryId = crypto.randomUUID();
        
        for (let j = 0; j < exercises.length; j++) {
          const exercise = exercises[j];
          const { error: weightError } = await serviceClient
            .from('weight_sets')
            .insert({
              user_id: demoUserId,
              entry_id: entryId,
              logged_date: dateStr,
              exercise_key: exercise.exercise_key,
              description: exercise.description,
              sets: exercise.sets,
              reps: exercise.reps,
              weight_lbs: exercise.weight_lbs,
              raw_input: j === 0 ? rawInput : null, // Only first exercise gets raw input
            });

          if (weightError) {
            console.error('Error inserting weight set:', weightError);
          } else {
            weightSetsCreated++;
          }
        }
      }
    }

    // Generate saved meals
    let savedMealsCreated = 0;
    if (savedMealsCount > 0) {
      const savedMeals = generateSavedMeals(savedMealsCount);
      
      for (const meal of savedMeals) {
        const { error: mealError } = await serviceClient
          .from('saved_meals')
          .insert({
            user_id: demoUserId,
            name: meal.name,
            original_input: meal.original_input,
            food_items: meal.food_items,
            use_count: meal.use_count,
            last_used_at: new Date(Date.now() - randomInt(1, 14) * 24 * 60 * 60 * 1000).toISOString(),
          });

        if (mealError) {
          console.error('Error inserting saved meal:', mealError);
        } else {
          savedMealsCreated++;
        }
      }
    }

    // Generate saved routines
    let savedRoutinesCreated = 0;
    if (savedRoutinesCount > 0) {
      const savedRoutines = generateSavedRoutines(savedRoutinesCount);
      
      for (const routine of savedRoutines) {
        const { error: routineError } = await serviceClient
          .from('saved_routines')
          .insert({
            user_id: demoUserId,
            name: routine.name,
            original_input: routine.original_input,
            exercise_sets: routine.exercise_sets,
            use_count: routine.use_count,
            last_used_at: new Date(Date.now() - randomInt(1, 14) * 24 * 60 * 60 * 1000).toISOString(),
          });

        if (routineError) {
          console.error('Error inserting saved routine:', routineError);
        } else {
          savedRoutinesCreated++;
        }
      }
    }

    const summary = {
      daysPopulated: selectedDays.length,
      foodEntries: foodEntriesCreated,
      weightSets: weightSetsCreated,
      savedMeals: savedMealsCreated,
      savedRoutines: savedRoutinesCreated,
      dateRange: {
        start: formatDate(startDate),
        end: formatDate(endDate),
      },
    };

    console.log('Population complete:', summary);

    return new Response(
      JSON.stringify({ success: true, summary }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error in populate-demo-data:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
