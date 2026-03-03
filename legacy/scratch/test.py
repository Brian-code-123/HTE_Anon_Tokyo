s1 = """Welcome to my world! 🌍  
Just starting out here and excited to connect with all of you.  
Looking forward to sharing moments, ideas, and maybe a few laughs along the way.  

Drop a hello 👋 or share something cool—let’s make this space awesome together!  

#NewHere #HelloWorld ⁣​​​‌​​​​​‌‌​‌​‌‌​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​‌‌​‌​‌‌​‌⁤⁣​​​‌​​​​​‌‌​‌​‌‌​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​‌‌​‌​‌‌​‌⁤#LetsConnect"""
s2 = """Welcome to my world! 🌍  
Just starting out here and excited to connect with all of you.  
Looking forward to sharing moments, ideas, and maybe a few laughs along the way.  

Drop a hello 👋 or share something cool—let’s make this space awesome together!  

#NewHere #HelloWorld ⁣​​​‌​​​​​‌‌​‌​‌‌​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​‌‌​‌​‌‌​‌⁤#LetsConnect"""
print(len(s1), len(s2))
for i in range(len(s1)):
    if s1[i] != s2[i]:
        print(f"Difference at index {i}: '{ord(s1[i])}' vs '{ord(s2[i])}'")