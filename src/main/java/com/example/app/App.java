package com.example.app;

/**
 * Hello world!
 */
public class App {

    public static void main(String[] args) throws Exception {
        var calculator = new BlockchainPoweredAiCalculator();
        var sum = calculator.add(22, 20);
        System.out.println("Hello World! " + sum);
    }
}
