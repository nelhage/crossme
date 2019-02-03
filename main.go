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
	if len(os.Args) > 1 {
		port = os.Args[1]
	}
	http.HandleFunc("/", handleReq)
	log.Fatal(http.ListenAndServe(port, nil))
}
