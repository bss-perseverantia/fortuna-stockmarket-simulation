#include <algorithm>
#include <fstream>
#include <iostream>

std::string minify(const std::string &filename) {
  std::fstream f(filename);
  std::string s;
  std::string line;
  while (std::getline(f, line)) {
    s += line;
  }
  s.erase(std::remove(s.begin(), s.end(), ' '), s.end());
  f.close();
  return s;
}

int main() {
  std::ofstream f(".env");
  f << "accounts=`" << minify("accounts.json")
    << "`\nun=\"admin\"\npass=\"sigmasigma123\"\nall_prices=`"
    << minify("all_prices.json") << "`\n";
  f.close();
}