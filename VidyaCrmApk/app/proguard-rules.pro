# Proguard rules for MyStaff Android
-keepattributes *Annotation*
-keepclassmembers class * {
    @com.google.gson.annotations.SerializedName <fields>;
}
-keep class mystaff.vidyadigitalstudio.com.data.models.** { *; }
-dontwarn okhttp3.**
-dontwarn retrofit2.**

