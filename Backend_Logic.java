import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;


// ======================================================
// MAIN BACKEND CLASS
// ======================================================

public class Backend_Logic {

    // Store all crowdfunding events
    static ArrayList<Event> events = new ArrayList<>();

    // ID for next event
    static int eventId = 1;


    // ==================================================
    // MAIN METHOD
    // ==================================================

    public static void main(String[] args) throws Exception {

        // Create server on port 8080
        HttpServer server = HttpServer.create(
                new InetSocketAddress(8080),
                0
        );


        // Create Event API
        server.createContext(
                "/create-event",
                Backend_Logic::createEvent
        );


        // Get all Events API
        server.createContext(
                "/events",
                Backend_Logic::getEvents
        );


        // Donation API
        server.createContext(
                "/donate",
                Backend_Logic::donate
        );


        // Start server
        server.start();


        System.out.println("--------------------------------");
        System.out.println("Crowdfunding Backend Started");
        System.out.println("Server: http://localhost:8080");
        System.out.println("--------------------------------");
    }


    // ==================================================
    // CREATE EVENT
    // ==================================================

    static void createEvent(HttpExchange exchange)
            throws IOException {

        addCors(exchange);


        // Handle browser OPTIONS request
        if (exchange.getRequestMethod().equals("OPTIONS")) {

            exchange.sendResponseHeaders(204, -1);

            return;
        }


        // Only POST request allowed
        if (!exchange.getRequestMethod().equals("POST")) {

            sendResponse(
                    exchange,
                    "Only POST request is allowed"
            );

            return;
        }


        // Read data from frontend
        String body = readBody(exchange);


        // Convert data to Map
        Map<String, String> data =
                parseData(body);


        String name =
                data.get("name");


        String description =
                data.get("description");


        String targetString =
                data.get("target");


        // Validate input
        if (
                name == null ||
                description == null ||
                targetString == null
        ) {

            sendResponse(
                    exchange,
                    "Invalid event details"
            );

            return;
        }


        double target;


        try {

            target =
                    Double.parseDouble(
                            targetString
                    );

        } catch (NumberFormatException e) {

            sendResponse(
                    exchange,
                    "Invalid target amount"
            );

            return;
        }


        // Target must be greater than zero
        if (target <= 0) {

            sendResponse(
                    exchange,
                    "Target amount must be greater than zero"
            );

            return;
        }


        // Create new Event
        Event event = new Event(
                eventId,
                name,
                description,
                target
        );


        // Add event to list
        events.add(event);


        // Increase ID
        eventId++;


        System.out.println(
                "Event Created: " +
                event.name
        );


        // Send response
        sendResponse(
                exchange,
                "Event created successfully!"
        );
    }


    // ==================================================
    // GET ALL EVENTS
    // ==================================================

    static void getEvents(HttpExchange exchange)
            throws IOException {

        addCors(exchange);


        // Only GET allowed
        if (!exchange.getRequestMethod().equals("GET")) {

            sendResponse(
                    exchange,
                    "Only GET request is allowed"
            );

            return;
        }


        StringBuilder json =
                new StringBuilder();


        json.append("[");


        // Loop through all events
        for (
                int i = 0;
                i < events.size();
                i++
        ) {

            Event event =
                    events.get(i);


            json.append("{");


            // ID
            json.append("\"id\":")
                    .append(event.id)
                    .append(",");


            // Name
            json.append("\"name\":\"")
                    .append(
                            escape(event.name)
                    )
                    .append("\",");


            // Description
            json.append("\"description\":\"")
                    .append(
                            escape(event.description)
                    )
                    .append("\",");


            // Target
            json.append("\"target\":")
                    .append(event.targetAmount)
                    .append(",");


            // Collected
            json.append("\"collected\":")
                    .append(event.collectedAmount)
                    .append(",");


            // Completed status
            json.append("\"completed\":")
                    .append(event.isCompleted());


            json.append("}");


            // Comma between objects
            if (i < events.size() - 1) {

                json.append(",");
            }
        }


        json.append("]");


        // Send JSON
        sendJson(
                exchange,
                json.toString()
        );
    }


    // ==================================================
    // DONATE
    // ==================================================

    static void donate(HttpExchange exchange)
            throws IOException {

        addCors(exchange);


        // Handle OPTIONS
        if (exchange.getRequestMethod().equals("OPTIONS")) {

            exchange.sendResponseHeaders(204, -1);

            return;
        }


        // Only POST allowed
        if (!exchange.getRequestMethod().equals("POST")) {

            sendResponse(
                    exchange,
                    "Only POST request is allowed"
            );

            return;
        }


        // Read request body
        String body =
                readBody(exchange);


        // Convert data
        Map<String, String> data =
                parseData(body);


        String idString =
                data.get("id");


        String amountString =
                data.get("amount");


        // Validate
        if (
                idString == null ||
                amountString == null
        ) {

            sendResponse(
                    exchange,
                    "Invalid donation data"
            );

            return;
        }


        int id;

        double amount;


        try {

            id =
                    Integer.parseInt(
                            idString
                    );


            amount =
                    Double.parseDouble(
                            amountString
                    );

        } catch (NumberFormatException e) {

            sendResponse(
                    exchange,
                    "Invalid donation data"
            );

            return;
        }


        // Find event
        Event event =
                findEvent(id);


        // Event not found
        if (event == null) {

            sendResponse(
                    exchange,
                    "Event not found"
            );

            return;
        }


        // Donate
        boolean success =
                event.donate(amount);


        if (success) {

            System.out.println(
                    "Donation received: ₹" +
                    amount +
                    " -> Event ID: " +
                    id
            );


            // Check completion
            if (event.isCompleted()) {

                System.out.println(
                        "Event completed: " +
                        event.name
                );
            }


            sendResponse(
                    exchange,
                    "Donation successful!"
            );

        } else {

            sendResponse(
                    exchange,
                    "Donation failed! Event may already be completed."
            );
        }
    }


    // ==================================================
    // FIND EVENT
    // ==================================================

    static Event findEvent(int id) {

        for (Event event : events) {

            if (event.id == id) {

                return event;
            }
        }


        return null;
    }


    // ==================================================
    // READ REQUEST BODY
    // ==================================================

    static String readBody(
            HttpExchange exchange
    ) throws IOException {

        InputStream input =
                exchange.getRequestBody();


        byte[] data =
                input.readAllBytes();


        return new String(
                data,
                StandardCharsets.UTF_8
        );
    }


    // ==================================================
    // PARSE FORM DATA
    // ==================================================

    static Map<String, String> parseData(
            String body
    ) throws IOException {

        Map<String, String> data =
                new HashMap<>();


        String[] pairs =
                body.split("&");


        for (String pair : pairs) {

            String[] keyValue =
                    pair.split("=", 2);


            if (keyValue.length == 2) {

                String key =
                        URLDecoder.decode(
                                keyValue[0],
                                StandardCharsets.UTF_8
                        );


                String value =
                        URLDecoder.decode(
                                keyValue[1],
                                StandardCharsets.UTF_8
                        );


                data.put(
                        key,
                        value
                );
            }
        }


        return data;
    }


    // ==================================================
    // NORMAL TEXT RESPONSE
    // ==================================================

    static void sendResponse(
            HttpExchange exchange,
            String response
    ) throws IOException {

        byte[] bytes =
                response.getBytes(
                        StandardCharsets.UTF_8
                );


        exchange.getResponseHeaders()
                .set(
                        "Content-Type",
                        "text/plain; charset=UTF-8"
                );


        exchange.sendResponseHeaders(
                200,
                bytes.length
        );


        OutputStream output =
                exchange.getResponseBody();


        output.write(bytes);

        output.close();
    }


    // ==================================================
    // JSON RESPONSE
    // ==================================================

    static void sendJson(
            HttpExchange exchange,
            String response
    ) throws IOException {

        byte[] bytes =
                response.getBytes(
                        StandardCharsets.UTF_8
                );


        exchange.getResponseHeaders()
                .set(
                        "Content-Type",
                        "application/json; charset=UTF-8"
                );


        exchange.sendResponseHeaders(
                200,
                bytes.length
        );


        OutputStream output =
                exchange.getResponseBody();


        output.write(bytes);

        output.close();
    }


    // ==================================================
    // CORS
    // ==================================================

    static void addCors(
            HttpExchange exchange
    ) {

        exchange.getResponseHeaders()
                .set(
                        "Access-Control-Allow-Origin",
                        "*"
                );


        exchange.getResponseHeaders()
                .set(
                        "Access-Control-Allow-Methods",
                        "GET, POST, OPTIONS"
                );


        exchange.getResponseHeaders()
                .set(
                        "Access-Control-Allow-Headers",
                        "Content-Type"
                );
    }


    // ==================================================
    // ESCAPE JSON SPECIAL CHARACTERS
    // ==================================================

    static String escape(String text) {

        return text
                .replace("\\", "\\\\")
                .replace("\"", "\\\"");
    }
}


// ======================================================
// EVENT CLASS
// ======================================================

class Event {

    int id;

    String name;

    String description;

    double targetAmount;

    double collectedAmount;


    // Constructor
    Event(
            int id,
            String name,
            String description,
            double targetAmount
    ) {

        this.id = id;

        this.name = name;

        this.description = description;

        this.targetAmount =
                targetAmount;

        this.collectedAmount = 0;
    }


    // ==================================================
    // DONATE
    // ==================================================

    boolean donate(double amount) {

        // Amount must be positive
        if (amount <= 0) {

            return false;
        }


        // Event already completed
        if (isCompleted()) {

            return false;
        }


        // Add donation
        collectedAmount += amount;


        // Don't allow collected amount
        // to exceed target
        if (
                collectedAmount >=
                targetAmount
        ) {

            collectedAmount =
                    targetAmount;
        }


        return true;
    }


    // ==================================================
    // CHECK COMPLETION
    // ==================================================

    boolean isCompleted() {

        return collectedAmount >= targetAmount;
    }
}


// ======================================================
// USER CLASS
// ======================================================

class User {

    int id;

    String name;


    User(
            int id,
            String name
    ) {

        this.id = id;

        this.name = name;
    }


    // User creates an event
    Event createEvent(
            int eventId,
            String eventName,
            String description,
            double targetAmount
    ) {

        return new Event(
                eventId,
                eventName,
                description,
                targetAmount
        );
    }


    // User donates to an event
    void donateToEvent(
            Event event,
            double amount
    ) {

        event.donate(amount);
    }
}