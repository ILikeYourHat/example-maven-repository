package com.example.app;

/**
 * Hello world!
 */
public class App {

    /**
     * The default constructor
     */
    public App() {
        // noop
    }

    /**
     * Start the application
     * @param args Command line arguments passed to the application
     * @throws Exception Bad things might happen..
     */
    public static void main(String[] args) throws Exception {
        var calculator = new BlockchainPoweredAiCalculator();
        var sum = calculator.add(22, 20);
        System.out.println("Hello World! " + sum);
    }
}
