import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Sample meals with realistic nutrition data
const MEALS = {
  breakfast: [
    { description: "Eggs & toast (2 eggs, 2 slices)", calories: 350, protein: 18, carbs: 30, fat: 16 },
    { description: "Oatmeal with berries (1 bowl)", calories: 280, protein: 8, carbs: 48, fat: 6 },
    { description: "Greek yogurt parfait (1 cup)", calories: 220, protein: 15, carbs: 28, fat: 5 },
    { description: "Bagel with cream cheese", calories: 380, protein: 12, carbs: 52, fat: 14 },
    { description: "Smoothie bowl (mixed fruit)", calories: 320, protein: 10, carbs: 58, fat: 6 },
    { description: "Avocado toast (2 slices)", calories: 340, protein: 10, carbs: 32, fat: 20 },
    { description: "Pancakes with syrup (3 small)", calories: 420, protein: 8, carbs: 68, fat: 12 },
    { description: "Cereal with milk (1.5 cups)", calories: 260, protein: 8, carbs: 44, fat: 6 },
  ],
  lunch: [
    { description: "Chicken salad (grilled)", calories: 450, protein: 35, carbs: 20, fat: 25 },
    { description: "Turkey sandwich", calories: 380, protein: 28, carbs: 42, fat: 12 },
    { description: "Caesar salad with chicken", calories: 420, protein: 32, carbs: 18, fat: 24 },
    { description: "Burrito bowl", calories: 520, protein: 28, carbs: 58, fat: 18 },
    { description: "Soup and half sandwich", calories: 380, protein: 18, carbs: 45, fat: 14 },
    { description: "Tuna wrap", calories: 360, protein: 25, carbs: 38, fat: 12 },
    { description: "Veggie stir fry with rice", calories: 440, protein: 14, carbs: 62, fat: 16 },
    { description: "Grilled cheese with tomato soup", calories: 480, protein: 16, carbs: 52, fat: 22 },
  ],
  dinner: [
    { description: "Salmon with rice (6oz)", calories: 550, protein: 40, carbs: 45, fat: 22 },
    { description: "Pasta with meat sauce", calories: 620, protein: 28, carbs: 72, fat: 24 },
    { description: "Grilled chicken with veggies", calories: 480, protein: 42, carbs: 25, fat: 22 },
    { description: "Steak with baked potato", calories: 680, protein: 45, carbs: 42, fat: 35 },
    { description: "Shrimp stir fry", calories: 420, protein: 32, carbs: 38, fat: 16 },
    { description: "Pizza (3 slices)", calories: 720, protein: 28, carbs: 78, fat: 32 },
    { description: "Tacos (3 soft shell)", calories: 540, protein: 26, carbs: 48, fat: 28 },
    { description: "Chicken curry with rice", calories: 580, protein: 32, carbs: 62, fat: 22 },
  ],
  snack: [
    { description: "Apple with peanut butter", calories: 280, protein: 7, carbs: 35, fat: 14 },
    { description: "Greek yogurt (plain)", calories: 150, protein: 15, carbs: 12, fat: 4 },
    { description: "Handful of almonds", calories: 180, protein: 6, carbs: 6, fat: 16 },
    { description: "Protein bar", calories: 220, protein: 20, carbs: 22, fat: 8 },
    { description: "Banana", calories: 105, protein: 1, carbs: 27, fat: 0 },
    { description: "Cheese and crackers", calories: 200, protein: 8, carbs: 18, fat: 12 },
    { description: "Trail mix (1/4 cup)", calories: 175, protein: 5, carbs: 18, fat: 10 },
    { description: "Hummus with veggies", calories: 160, protein: 5, carbs: 16, fat: 9 },
  ],
};

function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateUid(): string {
  return crypto.randomUUID();
}

// Generate entries for a single day (1-4 entries)
function generateDayEntries(date: string, userId: string): any[] {
  const numEntries = Math.floor(Math.random() * 4) + 1; // 1-4 entries
  const entries: any[] = [];
  
  // Decide which meal types to include based on numEntries
  const mealOrder = ["breakfast", "lunch", "dinner", "snack"];
  const selectedMeals: string[] = [];
  
  if (numEntries === 1) {
    // Single entry - usually lunch or dinner
    selectedMeals.push(Math.random() > 0.5 ? "lunch" : "dinner");
  } else if (numEntries === 2) {
    // Two entries - typically lunch and dinner
    selectedMeals.push("lunch", "dinner");
  } else if (numEntries === 3) {
    // Three entries - breakfast, lunch, dinner
    selectedMeals.push("breakfast", "lunch", "dinner");
  } else {
    // Four entries - all meals
    selectedMeals.push("breakfast", "lunch", "dinner", "snack");
  }
  
  for (const mealType of selectedMeals) {
    const meal = getRandomItem(MEALS[mealType as keyof typeof MEALS]);
    const foodItem = {
      uid: generateUid(),
      description: meal.description,
      calories: meal.calories,
      protein: meal.protein,
      carbs: meal.carbs,
      fat: meal.fat,
    };
    
    entries.push({
      user_id: userId,
      eaten_date: date,
      raw_input: meal.description,
      food_items: [foodItem],
      total_calories: meal.calories,
      total_protein: meal.protein,
      total_carbs: meal.carbs,
      total_fat: meal.fat,
    });
  }
  
  return entries;
}

// Generate 45-50 days of data over the last 60 days
function generateAllEntries(userId: string): any[] {
  const allEntries: any[] = [];
  const today = new Date();
  
  // Generate array of last 60 days
  const last60Days: string[] = [];
  for (let i = 0; i < 60; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    last60Days.push(date.toISOString().split("T")[0]);
  }
  
  // Randomly select 47 days (between 45-50)
  const shuffled = last60Days.sort(() => Math.random() - 0.5);
  const selectedDays = shuffled.slice(0, 47);
  
  // Generate entries for each selected day
  for (const date of selectedDays) {
    const dayEntries = generateDayEntries(date, userId);
    allEntries.push(...dayEntries);
  }
  
  console.log(`Generated ${allEntries.length} entries across ${selectedDays.length} days`);
  return allEntries;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Create admin client with service role key
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const testEmail = "testuser@logactually.test";
    const testPassword = "testpassword123";

    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === testEmail);
    
    let userId: string;
    
    if (existingUser) {
      console.log("Test user already exists, using existing user");
      userId = existingUser.id;
      
      // Delete existing food entries for this user to start fresh
      const { error: deleteError } = await supabaseAdmin
        .from("food_entries")
        .delete()
        .eq("user_id", userId);
      
      if (deleteError) {
        console.error("Error deleting existing entries:", deleteError);
      } else {
        console.log("Deleted existing food entries for test user");
      }
    } else {
      // Create new test user
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: testEmail,
        password: testPassword,
        email_confirm: true, // Skip email confirmation
      });
      
      if (createError) {
        throw new Error(`Failed to create user: ${createError.message}`);
      }
      
      userId = newUser.user.id;
      console.log("Created new test user:", userId);
    }

    // Generate food entries
    const entries = generateAllEntries(userId);
    
    // Insert entries in batches
    const batchSize = 50;
    let insertedCount = 0;
    
    for (let i = 0; i < entries.length; i += batchSize) {
      const batch = entries.slice(i, i + batchSize);
      const { error: insertError } = await supabaseAdmin
        .from("food_entries")
        .insert(batch);
      
      if (insertError) {
        console.error(`Error inserting batch ${i / batchSize + 1}:`, insertError);
        throw new Error(`Failed to insert entries: ${insertError.message}`);
      }
      
      insertedCount += batch.length;
    }

    console.log(`Successfully inserted ${insertedCount} food entries`);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Test user created/updated with food data",
        credentials: {
          email: testEmail,
          password: testPassword,
        },
        stats: {
          userId,
          entriesCreated: insertedCount,
          daysWithData: 47,
        },
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in seed-test-user:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage 
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
