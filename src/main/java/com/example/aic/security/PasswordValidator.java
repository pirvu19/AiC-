package com.example.aic.security;

import java.util.regex.Pattern;

public class PasswordValidator {
    // Length: 8-100 (recommended 12+, minimum 8)
    // At least one uppercase (A-Z)
    // At least one lowercase (a-z)
    // At least one digit (0-9)
    // At least one special character (!@#$%^&*()_+-=[]{}|;':",.<>?/)
    
    private static final String PASSWORD_PATTERN = 
        "^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*()_+\\-=\\[\\]{}|;':\",.<>?/]).{8,}$";

    private static final Pattern pattern = Pattern.compile(PASSWORD_PATTERN);

    public static boolean isValid(String password) {
        if (password == null) return false;
        return pattern.matcher(password).matches();
    }

    public static String getValidationMessage() {
        return "Parola trebuie să aibă între 8-12 caractere (recomandat 12+), să conțină cel puțin o literă mare, o literă mică, o cifră și un caracter special.";
    }
}
