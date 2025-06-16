// main.go
package main

import (
	"database/sql"
	"fmt"
	"log"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	_ "github.com/go-sql-driver/mysql" // MySQL driver
	"github.com/CPmohan/go-backend/pkg/handlers" // Adjust import path
)

func main() {
	// --- Database Connection ---
	// IMPORTANT: Replace with your MySQL connection details.
	// Format: "username:password@tcp(hostname:port)/database_name"
	dsn := "root:Zeb2001@cp@tcp(127.0.0.1:3306)/theory_db?parseTime=true"

	db, err := sql.Open("mysql", dsn)
	if err != nil {
		log.Fatalf("Failed to open database connection: %v", err)
	}
	defer db.Close()

	// Ping the database to verify the connection is alive.
	if err := db.Ping(); err != nil {
		log.Fatalf("Failed to ping database: %v", err)
	}
	fmt.Println("Successfully connected to MySQL database!")

	// --- Gin Router Setup ---
	router := gin.Default()

	config := cors.DefaultConfig()
	config.AllowOrigins = []string{"http://localhost:3000"}
	config.AllowMethods = []string{"POST", "OPTIONS"}
	config.AllowHeaders = []string{"Origin", "Content-Type", "Accept"}
	router.Use(cors.New(config))

	// Create a new handler instance with the database connection
	h := handlers.NewHandler(db)

	// API routes
	api := router.Group("/api")
	{
		courseGroup := api.Group("/course/:courseCode")
		{
			// Use the handler methods which now have access to the DB
			courseGroup.POST("/test1", h.HandleTest1Data)
			courseGroup.POST("/test2", h.HandleTest2Data) // Add this after implementing it
		}
		
		api.POST("/uploadIP", h.HandleIPData)
		api.POST("/uploadIP1COAttainment", h.HandleIP1COAttainmentData) // Add this after implementing it
		api.POST("/uploadIP2COAttainment", h.HandleIP2COAttainmentData) // Add this after implementing it
	}

	// Start server
	router.Run(":8080")
}