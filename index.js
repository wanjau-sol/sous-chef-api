import express from "express";
import axios from "axios";
import dotenv from "dotenv";
import pg from "pg";

dotenv.config();

const app = express();
const PORT = process.env.PORT;
const { Pool } = pg;

app.use(express.json());

const db = new Pool({
    user:process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME
});

// Test the connection when the srver starts
db.connect()
    .then(()=>{console.log("Database connected successfully.")})
    .catch((error)=>{console.error("Database connection error:", error.message)});

// Phase 1:Basic REST * JSON Structure
app.get("/api/random-recipe", async(req,res)=>{
    try{
        const response = await axios.get(`https://www.themealdb.com/api/json/v1/1/random.php`);
        
        const meal = response.data.meals[0];
        console.log(meal);

        res.json({
            success:true,
            recipe:{
                name:meal.strMeal,
                category: meal.strCategory,
                origin:meal.strArea,
                instructions:meal.strInstructions
            }
        });
    }catch(error) {
        // If external API fails, we return a 500 status code (Server Error)
        console.error("This the exact error:", error.message);
        res.status(500).json({
            success:false,
            message:"Failed to fetch recipe from kitchen.",
        });
    }
});

// Phase 2A:Path Parameters
//Endpint: /api/recipe/:id
app.get("/api/recipes/:id", async (req,res) =>{
    try{
        // req.params hold var pulled from the URL path
        const recipeId = req.params.id;

        const response = await axios.get(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${recipeId}`);

        if(!response.data.meals){
            return res.status(404).json({ success:false, message:"Recipe not found."});
        }

        const meal = response.data.meals[0];

        res.json({
            success: true,
            recipe: {
                id: meal.idMeal,
                name: meal.strMeal,
                category:meal.strCategory,
            }
        });
    }catch(error){
        console.error("Path param error:", error.message);
        res.status(500).json({ success:false, message: "Kitechen error"});
    }
});

// Phase 2B: Query Parameters
app.get("/api/search", async(req, res)=>{
    try{
        const mainIngredient = req.query.ingredient;

        if(!mainIngredient){
            return res.status(400).json({
                success:false,
                message:"Please provide an ingredient. Example: /api/search?ingredient=chicken"
            });
        }

        const response = await axios.get(`https://www.themealdb.com/api/json/v1/1/filter.php?i=${mainIngredient}`);

        if(!response.data.meals){
            return res.status(404).json({
                success:false,
                message: `No recipes found with ${mainIngredient}`
            });
        }

        const cleanResults = response.data.meals.map(meal=>({
            id: meal.idMeal,
            name: meal.strMeal
        }));

        res.json({
            success:true,
            resultCount:cleanResults.length,
            recipes:cleanResults
        });
    }catch(error){
        console.error("Query param error:", error.message);
        res.status(500).json({
            success:false,
            message:"Kitchen error."
        });
    }
});

//Phase 3: Basic Authentication
app.post("/api/kitchen/inventory", (req,res)=> {
    // Grab the Authorisaiton heaser from the incoming request
    const authHeader = req.headers.authorization;

    // 2.Check if the header exists and is formatted correctly
    if(!authHeader || !authHeader.startsWith("Basic ")){
        res.setHeader("WWW-Authenticate", "Basic");
        return res.status(401).json({ success: false, message: "Access denied.Credentials required!"});
    }

    // 3.Extract the Base64 string and decode it
    const base64Credentials = authHeader.split(" ")[1]
    const decodeText = Buffer.from(base64Credentials, "base64").toString("utf-8");

    // decodeText now looks like: "chef:spicy123"
    const [username, password] = decodeText.split(":");

    // 4. Verify the credentials (hardcoded for this lesson)
    if(username === "chef" && password === process.env.password){
        res.json({
            success:true,
            message: "Welcome, Chef! Here is the current invetory.",
            inventory:{ onions: 15, garlic: 30, heavyCream:5}
        });
    }else {
        res.status(401).json({ success: false, message: "Invalid username or password."});
    }
});

// Phase 4: Authorization & Bearer Tokens
app.get("/api/favorites", (req,res)=>{
    // Grab the authorzation header
    const authHeader = req.headers.authorization;

    // Check if exists and starts with Bearer
    if(!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            success:false,
            message:"Access denied. Bearer token required."
        });
    }

    // 3. Extract the token itself
    const token = authHeader.split(" ")[1];

    // 4. Verify token
    const validToken = process.env.token;

    if(token === validToken){
        res.json({
            success:"true",
            message: "Access granted to favorites",
            favorites: [
                { id: "52771", name: "Spicy Arrabiata Penne" },
                { id: "52844", name: "Lasagne" }
            ]
        });
    }else {
        // Token exists but is wrong (403 forbidden)
        res.status(403).json({
            success:false,
            message:"Invalid token. Access forbidden"
        })
    }
});

app.listen(PORT, ()=>{
    console.log(`Sous-Chef Gateway is running on port ${PORT}`);
});