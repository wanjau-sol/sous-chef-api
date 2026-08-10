import express from "express";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT;

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

app.listen(PORT, ()=>{
    console.log(`Sous-Chef Gateway is running on port ${PORT}`);
});