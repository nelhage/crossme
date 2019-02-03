package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
)

func handleReq(w http.ResponseWriter, r *http.Request) {
	http.Redirect(w, r, fmt.Sprintf("https://crossme.app%s", r.URL.Path), http.StatusMovedPermanently)
}

func main() {
	port := ":8080"
	if envPort := os.Getenv("PORT"); envPort != "" {
		port = fmt.Sprintf(":%s", envPort)
	}
	http.HandleFunc("/", handleReq)
	log.Fatal(http.ListenAndServe(port, nil))
}
